import { db } from './config/db.js';

async function check() {
  try {
    const res = await db.query(`SELECT id, email FROM users WHERE email IN ('admin@akksys.in', 'admin@akksys.com')`);
    for (const u of res.rows) {
      const qr = await db.query('SELECT count(*) FROM qr_codes WHERE created_by = $1', [u.id]);
      console.log(u.email, 'has', qr.rows[0].count, 'QR codes');
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
