import { db } from './config/db.js';

async function search() {
  try {
    const res = await db.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND data_type IN ('character varying', 'text', 'jsonb');
    `);
    
    for (const row of res.rows) {
      try {
        const check = await db.query(`SELECT * FROM ${row.table_name} WHERE ${row.column_name}::text LIKE '%akksys.in%'`);
        if (check.rows.length > 0) {
          console.log(`FOUND in ${row.table_name}.${row.column_name}:`);
          console.log(check.rows);
          // Auto update
          await db.query(`UPDATE ${row.table_name} SET ${row.column_name} = replace(${row.column_name}::text, 'akksys.in', 'akksys.com')::${row.data_type === 'jsonb' ? 'jsonb' : 'text'}`);
          console.log(`UPDATED ${row.table_name}.${row.column_name}`);
        }
      } catch (e) {
        // ignore errors on specific columns like unique constraint if it fails during update, or type cast issues
      }
    }
    console.log('Search complete.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
search();
