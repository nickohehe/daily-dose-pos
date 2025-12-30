import { query } from '../db.js';

async function showConfig() {
    try {
        const fileRes = await query('SHOW config_file;');
        console.log('\n\n==================================================');
        console.log('PG_CONF_PATH: ' + fileRes.rows[0].config_file);
        console.log('==================================================\n\n');
    } catch (err) {
        console.error('Error querying config:', err);
    } finally {
        process.exit();
    }
}

showConfig();
