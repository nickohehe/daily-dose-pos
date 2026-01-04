import { query } from '../db.js';

async function debugSeed() {
    try {
        console.log('Fetching items...');
        const { rows: items } = await query('SELECT * FROM menu_items WHERE is_available = TRUE');
        if (items.length === 0) {
            console.error('No items found');
            return;
        }
        console.log(`Found ${items.length} items`);

        const item = items[0];
        const orderId = `DEBUG-${Date.now()}`;

        console.log('Attempting Insert Order...');
        await query(
            `INSERT INTO orders (id, status, total_amount, customer_name, created_at, table_number, beeper_number, is_test)
             VALUES ($1, 'closed', $2, $3, NOW(), $4, $5, TRUE)`,
            [orderId, 100, 'Debug User', 1, 99]
        );
        console.log('Order Inserted');

        console.log('Attempting Insert Order Item...');
        // Intentionally omitting selected_flavor to test if it fails
        await query(
            `INSERT INTO order_items (order_id, menu_item_id, menu_item_name_snapshot, menu_item_price_snapshot, quantity)
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, item.id, item.name, item.price, 1]
        );
        console.log('Order Item Inserted');

    } catch (err) {
        console.error('SEED ERROR:', err);
    }
}

debugSeed();
