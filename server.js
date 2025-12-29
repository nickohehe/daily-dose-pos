import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { query, getClient } from './db.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import compression from 'compression';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

const PORT = process.env.PORT || 8080;

app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors());
app.use(express.json());

app.use(express.json());

// Initialize DB
// Initialize DB
const initDb = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                opened_at TIMESTAMP DEFAULT NOW(),
                closed_at TIMESTAMP,
                status VARCHAR(20) DEFAULT 'OPEN',
                total_orders INTEGER DEFAULT 0,
                total_sales DECIMAL(10,2) DEFAULT 0
            )
        `);
        // Ensure columns exist for existing tables
        try {
            await query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0`);
            await query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_sales DECIMAL(10,2) DEFAULT 0`);
            // Add deleted column to menu_items for soft delete
            await query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE`);
            // Add table_number to orders
            await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number INTEGER`);
            // Add beeper_number to orders
            await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS beeper_number INTEGER`);
        } catch (e) { /* ignore if exists */ }

        console.log('Sessions table ensured');
    } catch (err) {
        console.error('Failed to init DB:', err);
    }
};

const attachItemsToOrders = async (orders) => {
    if (orders.length === 0) return [];

    const orderIds = orders.map(o => o.id);
    const { rows: items } = await query(
        `SELECT * FROM order_items WHERE order_id = ANY($1::text[])`,
        [orderIds]
    );

    const itemsMap = {};
    items.forEach(item => {
        if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
        itemsMap[item.order_id].push({
            menuItem: {
                id: item.menu_item_id,
                name: item.menu_item_name_snapshot,
                price: parseFloat(item.menu_item_price_snapshot)
            },
            quantity: item.quantity
        });
    });

    return orders.map(order => ({
        ...order,
        total: parseFloat(order.total_amount),
        items: itemsMap[order.id] || []
    }));
};

app.get('/api/menu', async (req, res) => {
    try {
        const { rows: categories } = await query('SELECT name FROM categories ORDER BY name');
        // Filter out deleted items
        const { rows: items } = await query('SELECT * FROM menu_items WHERE deleted = FALSE OR deleted IS NULL ORDER BY category, name');

        console.log(`Fetched ${items.length} active menu items`);

        const formattedItems = items.map(item => ({
            ...item,
            price: parseFloat(item.price),
            isAvailable: item.is_available,
            image: item.image_url // Ensure image property is populated if needed
        }));

        res.json({
            categories: categories.map(c => c.name),
            items: formattedItems
        });
    } catch (err) {
        console.error('Error fetching menu:', err);
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

app.post('/api/menu/items', async (req, res) => {
    const newItem = req.body;
    if (!newItem.id) newItem.id = Date.now().toString();

    try {
        await query(
            `INSERT INTO menu_items (id, name, price, category, emoji, image_url, description, is_available, deleted)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                newItem.id,
                newItem.name,
                newItem.price,
                newItem.category,
                newItem.emoji,
                newItem.image,
                newItem.description,
                newItem.isAvailable ?? true,
                false // Explicitly not deleted
            ]
        );
        res.status(201).json(newItem);
        io.emit('menu:update');
    } catch (err) {
        console.error('Error adding menu item:', err);
        res.status(500).json({ error: 'Failed to add menu item' });
    }
});

app.put('/api/menu/items/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const fields = [];
        const values = [];
        let idx = 1;

        if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
        if (updates.price !== undefined) { fields.push(`price = $${idx++}`); values.push(updates.price); }
        if (updates.category !== undefined) { fields.push(`category = $${idx++}`); values.push(updates.category); }
        if (updates.emoji !== undefined) { fields.push(`emoji = $${idx++}`); values.push(updates.emoji); }
        if (updates.image !== undefined) { fields.push(`image_url = $${idx++}`); values.push(updates.image); }
        if (updates.isAvailable !== undefined) { fields.push(`is_available = $${idx++}`); values.push(updates.isAvailable); }

        if (fields.length === 0) return res.json({ message: 'No updates provided' });

        values.push(id);
        const sql = `UPDATE menu_items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

        const { rows } = await query(sql, values);
        if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });

        const updatedItem = rows[0];
        res.json({
            ...updatedItem,
            price: parseFloat(updatedItem.price),
            isAvailable: updatedItem.is_available,
            image: updatedItem.image_url
        });
        io.emit('menu:update');
    } catch (err) {
        console.error('Error updating menu item:', err);
        res.status(500).json({ error: 'Failed to update menu item' });
    }
});

app.delete('/api/menu/items/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete
        await query('UPDATE menu_items SET deleted = TRUE WHERE id = $1', [id]);
        res.json({ success: true });
        io.emit('menu:update');
    } catch (err) {
        console.error('Error deleting menu item:', err);
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
});

app.post('/api/menu/categories', async (req, res) => {
    const { category } = req.body;
    try {
        await query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING', [category]);
        const { rows } = await query('SELECT name FROM categories ORDER BY name');
        res.json(rows.map(c => c.name));
        io.emit('menu:update');
    } catch (err) {
        console.error('Error adding category:', err);
        res.status(500).json({ error: 'Failed to add category' });
    }
});

app.delete('/api/menu/categories/:name', async (req, res) => {
    const { name } = req.params;
    if (name === 'All') return res.status(400).json({ error: 'Cannot delete default category' });

    try {
        await query('DELETE FROM categories WHERE name = $1', [name]);
        const { rows } = await query('SELECT name FROM categories ORDER BY name');
        res.json(rows.map(c => c.name));
        io.emit('menu:update');
    } catch (err) {
        console.error('Error deleting category:', err);
        res.status(500).json({ error: err.message || 'Failed to delete category' });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const { rows: orders } = await query(
            `SELECT * FROM orders WHERE status != 'closed' ORDER BY created_at DESC`
        );
        const fullOrders = await attachItemsToOrders(orders);
        res.json(fullOrders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.post('/api/orders', async (req, res) => {
    const newOrder = req.body;
    if (!newOrder.id) newOrder.id = `DAILY-${Date.now()}`;
    const createdAt = newOrder.createdAt || new Date();

    const client = await getClient();
    try {
        // Check for active session
        const { rows: activeSession } = await client.query("SELECT * FROM sessions WHERE status = 'OPEN'");
        if (activeSession.length === 0) {
            return res.status(403).json({ error: 'Store is closed. Please open the store first.' });
        }

        await client.query('BEGIN');

        await client.query(
            `INSERT INTO orders (id, status, total_amount, customer_name, created_at, table_number, beeper_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                newOrder.id,
                newOrder.status || 'new',
                newOrder.total || 0,
                newOrder.customerName,
                createdAt,
                newOrder.tableNumber || null,
                newOrder.beeperNumber || null
            ]
        );

        if (newOrder.items && newOrder.items.length > 0) {
            for (const item of newOrder.items) {
                await client.query(
                    `INSERT INTO order_items (order_id, menu_item_id, menu_item_name_snapshot, menu_item_price_snapshot, quantity)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        newOrder.id,
                        item.menuItem.id,
                        item.menuItem.name,
                        item.menuItem.price,
                        item.quantity
                    ]
                );
            }
        }

        await client.query('COMMIT');

        res.status(201).json(newOrder);

        io.emit('order:new', newOrder);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        client.release();
    }
});

app.patch('/api/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);

        const { rows } = await query('SELECT * FROM orders WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });

        const fullOrders = await attachItemsToOrders(rows);
        const updatedOrder = fullOrders[0];

        res.json(updatedOrder);

        io.emit('order:update', updatedOrder);
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

app.post('/api/admin/close-day', async (req, res) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('sv');

    try {
        // Calculate totals for the session being closed
        // We look for active orders (not closed) that are about to be closed
        const { rows: metrics } = await query(
            `SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_sales 
             FROM orders 
             WHERE status != 'closed'`
        );

        const sessionOrders = parseInt(metrics[0]?.total_orders || 0);
        const sessionSales = parseFloat(metrics[0]?.total_sales || 0);

        // Close the session in DB
        await query(
            `UPDATE sessions 
             SET status = 'CLOSED', closed_at = $1, total_orders = $2, total_sales = $3 
             WHERE status = 'OPEN'`,
            [now, sessionOrders, sessionSales]
        );

        const result = await query(
            `UPDATE orders 
             SET status = 'closed', closed_at = $1 
             WHERE status != 'closed'`,
            [now]
        );

        const { rows: summaryRows } = await query(
            `SELECT COUNT(*) as total_orders, SUM(total_amount) as total_sales 
             FROM orders 
             WHERE closed_at = $1`,
            [now]
        );

        const { rows: todayMetrics } = await query(
            `SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_sales 
             FROM orders 
             WHERE DATE(closed_at) = DATE($1)`,
            [now]
        );

        res.json({
            message: 'Day closed successfully',
            summary: {
                date: dateStr,
                totalOrders: parseInt(todayMetrics[0].total_orders),
                totalSales: parseFloat(todayMetrics[0].total_sales)
            }
        });

    } catch (err) {
        console.error('Error closing day:', err);
        res.status(500).json({ error: 'Failed to close day' });
    }

});

app.post('/api/admin/open-day', async (req, res) => {
    try {
        const { rows: active } = await query("SELECT * FROM sessions WHERE status = 'OPEN'");
        if (active.length > 0) return res.status(400).json({ error: 'Session already open' });

        await query("INSERT INTO sessions (status) VALUES ('OPEN')");
        res.json({ message: 'Session opened successfully' });
    } catch (err) {
        console.error('Error opening day:', err);
        res.status(500).json({ error: 'Failed to open day' });
    }
});

app.get('/api/admin/status', async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM sessions ORDER BY opened_at DESC LIMIT 1');
        const lastSession = rows[0];

        if (!lastSession || lastSession.status === 'CLOSED') {
            return res.json({
                status: 'CLOSED',
                lastClosed: lastSession?.closed_at
            });
        }

        res.json({
            status: 'OPEN',
            openedAt: lastSession.opened_at,
            id: lastSession.id
        });
    } catch (err) {
        console.error('Error getting status:', err);
        res.status(500).json({ error: 'Failed to get status' });
    }
});

app.get('/api/admin/history', async (req, res) => {
    try {
        // Fetch sessions
        const { rows: sessionRows } = await query(`
            SELECT * FROM sessions 
            WHERE status = 'CLOSED' 
            ORDER BY closed_at DESC
        `);

        // Fetch legacy history (aggregated from orders where date is NOT in sessions to avoid duplicates)
        // Actually, simplest is to just fetch legacy stats and merge.
        // Or, if the user starts fresh, we rely on sessions. 
        // Let's rely on sessions for reliable Open/Close times. 
        // But for "History archive doesn't update", it's likely because previous impl relied on orders.
        // Let's return the sessions list.

        const historyList = sessionRows.map(row => ({
            filename: row.id.toString(), // Used for key/fetching details. We might need to adjust detail fetch to support IDs.
            date: new Date(row.closed_at).toLocaleDateString('sv'),
            openedAt: row.opened_at,
            closedAt: row.closed_at,
            totalOrders: parseInt(row.total_orders || 0),
            totalSales: parseFloat(row.total_sales || 0)
        }));

        res.json(historyList);
    } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.get('/api/admin/history/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Check if id is a date string (legacy) or a session ID (integer)
        // Regex to check if digits
        const isSessionId = /^\d+$/.test(id);

        let orders = [];
        let sessionData = null;

        if (isSessionId) {
            // Fetch by Session ID
            const { rows: sessions } = await query('SELECT * FROM sessions WHERE id = $1', [id]);
            if (sessions.length === 0) return res.status(404).json({ error: 'Session not found' });
            sessionData = sessions[0];

            // Fetch orders for this session. 
            // We need to associate orders with sessions. 
            // Current DB doesn't have session_id on orders. 
            // We have to rely on time range [opened_at, closed_at].

            const { rows: sessionOrders } = await query(
                `SELECT * FROM orders 
                 WHERE created_at >= $1 AND created_at <= $2
                 ORDER BY created_at DESC`,
                [sessionData.opened_at, sessionData.closed_at]
            );
            orders = sessionOrders;

        } else {
            // Legacy Date Fetch
            const { rows: dateOrders } = await query(
                `SELECT * FROM orders 
                 WHERE status = 'closed' AND DATE(closed_at) = DATE($1)
                 ORDER BY closed_at DESC`,
                [id] // id is date string
            );
            orders = dateOrders;
        }

        if (orders.length === 0 && !sessionData) {
            return res.status(404).json({ error: 'No history found' });
        }

        const fullOrders = await attachItemsToOrders(orders);
        const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

        // Return structured data
        res.json({
            date: sessionData ? new Date(sessionData.closed_at).toLocaleDateString('sv') : id,
            closedAt: sessionData ? sessionData.closed_at : orders[0]?.closed_at,
            openedAt: sessionData ? sessionData.opened_at : null,
            totalOrders: orders.length,
            totalSales: totalSales,
            orders: fullOrders
        });
    } catch (err) {
        console.error('Error fetching history detail:', err);
        res.status(500).json({ error: 'Failed to fetch history detail' });
    }
});

app.get('/api/admin/analytics', async (req, res) => {
    const { period } = req.query;
    const limitDays = period === 'month' ? 30 : 7;

    try {
        const dailySql = `
            SELECT 
                DATE(created_at) as date, 
                COUNT(*) as orders, 
                SUM(total_amount) as sales 
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '${limitDays} days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `;
        const { rows: dailyRows } = await query(dailySql);

        const dailyTotals = dailyRows.map(r => ({
            date: r.date.toISOString().split('T')[0],
            sales: parseFloat(r.sales),
            orders: parseInt(r.orders)
        }));

        const itemsSql = `
            SELECT 
                menu_item_name_snapshot as name, 
                SUM(quantity) as quantity, 
                SUM(quantity * menu_item_price_snapshot) as sales
            FROM order_items
            JOIN orders ON orders.id = order_items.order_id
            WHERE orders.created_at >= NOW() - INTERVAL '${limitDays} days'
            GROUP BY menu_item_name_snapshot
            ORDER BY quantity DESC
            LIMIT 10
        `;
        const { rows: itemRows } = await query(itemsSql);

        const topItems = itemRows.map(r => ({
            name: r.name,
            quantity: parseInt(r.quantity),
            sales: parseFloat(r.sales)
        }));



        const hourlySql = `
            SELECT 
                EXTRACT(HOUR FROM created_at) as hour, 
                COUNT(*) as orders 
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '${limitDays} days'
            GROUP BY hour
            ORDER BY hour ASC
        `;
        const { rows: hourlyRows } = await query(hourlySql);

        // Fill in missing hours
        const hourlyStats = Array.from({ length: 24 }, (_, i) => {
            const found = hourlyRows.find(r => parseInt(r.hour) === i);
            return {
                hour: i,
                label: `${i}:00`,
                orders: found ? parseInt(found.orders) : 0
            };
        });

        res.json({ topItems, dailyTotals, hourlyStats });

    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Failed to generate analytics' });
    }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const startServer = async () => {
    await initDb();
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
