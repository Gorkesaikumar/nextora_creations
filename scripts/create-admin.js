import { randomUUID } from 'node:crypto';
import { getDatabase } from '../server/db.js';
import { email, password } from '../server/domain.js';
import { hashPassword } from '../server/auth.js';
import { audit } from '../server/service.js';
const adminEmail = email.parse(process.env.ADMIN_EMAIL);
const adminPassword = password.parse(process.env.ADMIN_PASSWORD);
const db = getDatabase();
try {
  const id = randomUUID(), encoded = await hashPassword(adminPassword);
  await db.transaction(async tx => {
    await tx.query("INSERT INTO nc.users(id,email,password_hash,role) VALUES($1,$2,$3,'ADMIN')", [id,adminEmail,encoded]);
    await audit(tx, 'ADMIN_CREATED', id);
  });
  console.log('Administrator created. Sign in at /admin/internships. Remove ADMIN_PASSWORD from your environment.');
} finally { await db.close(); }
