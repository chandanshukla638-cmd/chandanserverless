import { db } from '../config/db.js';
import { hashPassword } from '../utils/hashPassword.js';

export const seed = async (shouldExit = false) => {
  try {
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', ['admin@akksys.com']);
    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists');
      if (shouldExit) process.exit(0);
      return;
    }

    const passwordHash = await hashPassword('admin123');
    await db.query(
      'INSERT INTO users (name, email, password_hash, phone, company, role) VALUES ($1, $2, $3, $4, $5, $6)',
      ['Admin User', 'admin@akksys.com', passwordHash, '+91 98765 43210', 'AKKSYS', 'superadmin']
    );

    // Insert default settings
    await db.query(
      `INSERT INTO settings (id, company_name, primary_color, secondary_color) VALUES (1, 'AKKSYS', '#00C8FF', '#4DDCFF')
       ON CONFLICT (id) DO NOTHING`
    );

    console.log('Admin user created: admin@akksys.com / admin123');
    if (shouldExit) process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    if (shouldExit) process.exit(1);
  }
};

import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed(true);
}
