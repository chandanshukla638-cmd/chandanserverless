import { db } from './config/db.js';

async function fixUser() {
  try {
    // Delete the existing admin@akksys.com if it exists
    await db.query(`DELETE FROM users WHERE email = 'admin@akksys.com'`);
    // Update admin@akksys.in to admin@akksys.com
    await db.query(`UPDATE users SET email = 'admin@akksys.com' WHERE email = 'admin@akksys.in'`);
    console.log('Fixed users');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
fixUser();
