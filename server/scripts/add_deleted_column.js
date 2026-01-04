
import { query, getClient } from '../db.js';

async function fixSchema() {
    console.log('Fixing schema...');
    try {
        await query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE`);
        console.log('✅ Added "deleted" column to menu_items');
    } catch (err) {
        console.error('❌ Error adding column:', err);
    }
    process.exit(0);
}

fixSchema();
