import { randomBytes, createHash, createHmac, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { assert } from './domain.js';
const scrypt = promisify(scryptCallback);
export const token = () => randomBytes(32).toString('base64url');
export const hash = value => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt:${salt}:${derived.toString('hex')}`;
}
export async function checkPassword(password, stored) {
  const [, salt, expected] = (stored || `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
  const derived = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const buffer = Buffer.from(expected, 'hex');
  return buffer.length === derived.length && timingSafeEqual(buffer, derived) && Boolean(stored);
}
export const cookieName = production => production ? '__Host-nc_session' : 'nc_session';
export function sessionCookie(value, production, maxAge = 28800) {
  return `${cookieName(production)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${production ? '; Secure' : ''}`;
}
export function cookieToken(request, production) {
  const cookies = (request.headers.get('cookie') || '').split(';').map(v => v.trim());
  const value = cookies.find(v => v.startsWith(`${cookieName(production)}=`))?.split('=')[1];
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}
export async function authenticate(db, request, production) {
  const raw = cookieToken(request, production);
  assert(raw, 401, 'Please sign in to continue.');
  const { rows } = await db.query(`SELECT u.id,u.email,u.role,s.csrf_token,s.token_hash
    FROM nc.sessions s JOIN nc.users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at > now() AND NOT u.disabled`, [hash(raw)]);
  assert(rows[0], 401, 'Your session has expired. Please sign in again.');
  return rows[0];
}
export async function rateLimit(db, key, limit, seconds, secret) {
  const digest = createHmac('sha256', secret).update(key).digest('hex');
  const { rows } = await db.query(`INSERT INTO nc.rate_limits(key,count,expires_at)
    VALUES($1,1,now()+($2 * interval '1 second'))
    ON CONFLICT(key) DO UPDATE SET
      count=CASE WHEN nc.rate_limits.expires_at <= now() THEN 1 ELSE nc.rate_limits.count+1 END,
      expires_at=CASE WHEN nc.rate_limits.expires_at <= now() THEN EXCLUDED.expires_at ELSE nc.rate_limits.expires_at END
    RETURNING count`, [digest, seconds]);
  assert(rows[0].count <= limit, 429, 'Too many requests. Please try again later.', 'RATE_LIMITED');
}
