import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const MIGRATIONS = ['001_init.sql', '002_indexes_refresh_tokens.sql'];

async function migrate(): Promise<void> {
  const connectionString = process.env['DATABASE_URL'];

  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    for (const file of MIGRATIONS) {
      const filePath = join(process.cwd(), 'migrations', file);
      const sql = readFileSync(filePath, 'utf-8');
      console.log(`Running: ${file} ...`);
      await client.query(sql);
      console.log(`  done: ${file}`);
    }

    console.log('\nAll migrations completed successfully.');
  } catch (err) {
    console.error('\nMigration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
