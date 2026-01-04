import { query } from '../db.js';

const runOptimization = async () => {
    console.log('Running database optimization...');

    try {
        console.log('Adding index on orders(status)...');
        await query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);

        console.log('Adding index on orders(created_at)...');
        await query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);`);

        console.log('Adding index on orders(closed_at)...');
        await query(`CREATE INDEX IF NOT EXISTS idx_orders_closed_at ON orders(closed_at);`);

        console.log('Adding index on order_items(order_id)...');
        await query(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`);

        console.log('Adding index on order_items(menu_item_id)...');
        await query(`CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);`);

        console.log('Adding index on menu_items(category)...');
        await query(`CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);`);

        console.log('Optimization complete! Indexes created.');
    } catch (err) {
        console.error('Optimization failed:', err);
    } finally {
        process.exit();
    }
};

runOptimization();
