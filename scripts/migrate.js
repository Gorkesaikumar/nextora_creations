import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDatabase } from '../server/db.js';
import { hash } from '../server/auth.js';
export async function migrate(db) {
  await db.transaction(async tx => {
    await tx.query("SELECT pg_advisory_xact_lock(739201516)");
    await tx.query('CREATE SCHEMA IF NOT EXISTS nc');
    await tx.query('CREATE TABLE IF NOT EXISTS nc.schema_migrations(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const files = (await readdir(resolve('server/migrations'))).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = (await readFile(resolve('server/migrations', file), 'utf8')).replace(/\r\n/g, '\n'), checksum = hash(sql);
      const existing = (await tx.query('SELECT checksum FROM nc.schema_migrations WHERE name=$1', [file])).rows[0];
      if (existing) {
        if (existing.checksum !== checksum) throw new Error(`Migration ${file} was changed after application. Add a new migration instead.`);
        continue;
      }
      await tx.query(sql);
      await tx.query('INSERT INTO nc.schema_migrations(name,checksum) VALUES($1,$2)', [file,checksum]);
      console.log(`Applied ${file}`);
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const db = getDatabase();
  try { await migrate(db); } finally { await db.close(); }
}
