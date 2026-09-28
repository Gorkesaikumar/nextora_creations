import pg from 'pg';

// Keep date-only columns timezone-independent, including end-of-month boundaries.
pg.types.setTypeParser(1082, value => value);
let database;
export function getDatabase() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!database) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL,
      max: 3, idleTimeoutMillis: 20000, connectionTimeoutMillis: 8000,
      statement_timeout: 15000 });
    database = {
      query: (sql, values) => pool.query(sql, values),
      async transaction(fn) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await fn(client);
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally { client.release(); }
      },
      close: () => pool.end(),
    };
  }
  return database;
}
