import { getDatabase } from '../server/db.js';
const db = getDatabase();
try {
  await db.transaction(async tx => {
    await tx.query('DELETE FROM nc.sessions WHERE expires_at < now()');
    await tx.query("DELETE FROM nc.invitations WHERE expires_at < now()-interval '7 days'");
    await tx.query("DELETE FROM nc.rate_limits WHERE expires_at < now()-interval '1 day'");
  });
  console.log('Expired authentication and rate-limit records cleaned. Internship, certificate and audit history preserved.');
} finally { await db.close(); }
