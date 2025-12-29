import { query, getClient } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const CURRENT_ORDERS_FILE = path.join(DATA_DIR, 'current-orders.json');
const HISTORY_DIR = path.join(DATA_DIR, 'history');

async function migrate() {
    console.log('Starting migration...');
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // 1. Migrate Menu
        if (fs.existsSync(MENU_FILE)) {
            const menuData = JSON.parse(fs.readFileSync(MENU_FILE, 'utf8'));

            // Categories
            const categoriesToMigrate = [...menuData.categories, 'Legacy'];
            for (const cat of categoriesToMigrate) {
                await client.query(
                    'INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING',
                    [cat]
                );
            }
            console.log(`Migrated ${menuData.categories.length} categories.`);

            // Items
            for (const item of menuData.items) {
                await client.query(
                    `INSERT INTO menu_items (id, name, price, category, emoji, is_available)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (id) DO UPDATE SET
                     name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category`,
                    [item.id, item.name, item.price, item.category, item.emoji || '', true]
                );
            }
            console.log(`Migrated ${menuData.items.length} menu items.`);
        }

        // 2. Migrate Current Orders
        if (fs.existsSync(CURRENT_ORDERS_FILE)) {
            const orders = JSON.parse(fs.readFileSync(CURRENT_ORDERS_FILE, 'utf8'));
            await migrateOrders(client, orders);
            console.log(`Migrated ${orders.length} active orders.`);
        }

        // 3. Migrate History
        if (fs.existsSync(HISTORY_DIR)) {
            const files = fs.readdirSync(HISTORY_DIR).filter(f => f.endsWith('.json'));
            let totalHistoryOrders = 0;

            for (const file of files) {
                const content = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, file), 'utf8'));
                // History files contain a summary; we need the 'orders' array inside if it exists
                if (content.orders && Array.isArray(content.orders)) {
                    await migrateOrders(client, content.orders, content.closedAt || content.date);
                    totalHistoryOrders += content.orders.length;
                }
            }
            console.log(`Migrated ${totalHistoryOrders} historical orders.`);
        }

        await client.query('COMMIT');
        console.log('✅ Migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

async function migrateOrders(client, orders, closedAtDate = null) {
    for (const order of orders) {
        // Ensure Order ID
        const orderId = order.id || `LEGACY-${Date.now()}-${Math.random()}`;

        // Insert Order
        await client.query(
            `INSERT INTO orders (id, status, total_amount, customer_name, created_at, closed_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [
                orderId,
                order.status || 'completed',
                order.total || 0,
                order.customerName || null,
                order.createdAt || new Date(),
                closedAtDate // Null for active orders
            ]
        );

        // Insert Items
        if (order.items && Array.isArray(order.items)) {
            for (const item of order.items) {
                if (!item.menuItem || !item.menuItem.id) continue;

                // Ensure item exists (Restore orphaned items)
                await client.query(
                    `INSERT INTO menu_items (id, name, price, category, emoji, is_available)
                     VALUES ($1, $2, $3, $4, '', false)
                     ON CONFLICT (id) DO NOTHING`,
                    [
                        item.menuItem.id,
                        item.menuItem.name,
                        item.menuItem.price,
                        'Legacy' // Use a 'Legacy' category for restored items
                    ]
                );

                await client.query(
                    `INSERT INTO order_items (order_id, menu_item_id, menu_item_name_snapshot, menu_item_price_snapshot, quantity)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        orderId,
                        item.menuItem.id,
                        item.menuItem.name,
                        item.menuItem.price,
                        item.quantity
                    ]
                );
            }
        }
    }
}

migrate();
