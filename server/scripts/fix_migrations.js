
import { query, getClient } from '../db.js';

async function fixMigrations() {
    console.log('Running manual migration fix...');
    try {
        console.log('Checking "is_test" column in "orders" table...');
        await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE`);
        console.log('✅ "is_test" column ensured.');

        console.log('Checking "selected_flavor" column in "order_items" table...');
        await query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_flavor VARCHAR(255)`);
        console.log('✅ "selected_flavor" column ensured.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit();
    }
}

fixMigrations();
