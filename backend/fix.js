import { db } from './config/db.js';

async function fix() {
  try {
    await db.query(`UPDATE landing_content SET legal_pages = replace(legal_pages::text, 'akksys.in', 'akksys.com')::jsonb`);
    console.log('Fixed legal_pages');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
fix();
