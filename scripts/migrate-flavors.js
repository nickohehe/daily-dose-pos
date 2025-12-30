import { query, getClient } from '../db.js';

async function migrate() {
    console.log('Starting migration for multi-flavor support...');
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // 1. Add max_flavors to menu_items to control how many can be picked
        console.log('Adding max_flavors to menu_items...');
        await client.query(`
            ALTER TABLE menu_items 
            ADD COLUMN IF NOT EXISTS max_flavors INTEGER DEFAULT 1
        `);

        // 2. Add selected_flavors (JSONB) to order_items
        console.log('Adding selected_flavors to order_items...');
        await client.query(`
            ALTER TABLE order_items 
            ADD COLUMN IF NOT EXISTS selected_flavors JSONB DEFAULT '[]'
        `);

        // 3. Migrate existing selected_flavor (string) -> selected_flavors (array)
        console.log('Migrating existing flavor data...');
        // Only doing this if selected_flavor column exists
        const { rows: checkCol } = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='order_items' AND column_name='selected_flavor'
        `);

        if (checkCol.length > 0) {
            await client.query(`
                UPDATE order_items 
                SET selected_flavors = jsonb_build_array(selected_flavor)
                WHERE selected_flavor IS NOT NULL AND selected_flavor != '' AND selected_flavors = '[]'
            `);
            console.log('Data migration complete.');
        }

        await client.query('COMMIT');
        console.log('✅ Migration successful!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
