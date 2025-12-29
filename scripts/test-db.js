import { checkConnection } from '../db.js';

console.log('Testing database connection...');
const success = await checkConnection();

if (success) {
    console.log('✅ Connection Successful!');
    process.exit(0);
} else {
    console.error('❌ Connection Failed. Please ensure PostgreSQL is running and credentials are correct in .env');
    process.exit(1);
}
