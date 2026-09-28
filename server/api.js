import { publicExtension, privateExtension, saveProgram } from './admin-extension.js';
import { z, ZodError } from 'zod';
import { authenticate, checkPassword, hashPassword, hash, token, sessionCookie, rateLimit } from './auth.js';
import { assert, HttpError, email, password, uuid, programSchema, createInternshipSchema, internshipFields,
  profileSchema, states, eligibility, certificatePattern, officialOrigin, publicCertificate } from './domain.js';
import { InternshipService, audit, joinedInternships } from './service.js';

const baseHeaders = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', 'Vary': 'Cookie' };
const json = (value, status = 200, extra = {}) => new Response(JSON.stringify(value), {
  status, headers: { ...baseHeaders, 'Content-Type': 'application/json; charset=utf-8', ...extra },
});
const localSecret = token();
export function configuration(env = process.env) {
  const production = env.NODE_ENV === 'production' || env.NETLIFY === 'true';
  const app = new URL(env.APP_URL || (production ? '' : 'http://localhost:5173'));
  assert(!app.username && !app.password && app.pathname === '/' && !app.search && !app.hash &&
    (production ? app.protocol === 'https:' : ['http:','https:'].includes(app.protocol)), 503, 'APP_URL must be an application origin.');
  assert(!production || (env.RATE_LIMIT_SECRET || '').length >= 32, 503, 'Server security configuration is incomplete.');
  return { production, appOrigin: app.origin,
    officialOrigin: officialOrigin(env.CERTIFICATE_BASE_URL || 'https://nextoracreations.co.in'),
    rateSecret: env.RATE_LIMIT_SECRET || localSecret,
    signatureBase64: env.CERTIFICATE_SIGNATURE_BASE64, signaturePath: env.CERTIFICATE_SIGNATURE_PATH };
}
async function body(request, schema, limit = 16384) {
  assert(request.headers.get('content-type')?.split(';')[0] === 'application/json', 415, 'Send a JSON request.');
  const reader = request.body?.getReader();
  assert(reader, 400, 'Request body is required.');
  const parts = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new HttpError(413, 'Request body is too large.'); }
    parts.push(Buffer.from(value));
  }
  let data;
  try { data = JSON.parse(Buffer.concat(parts).toString('utf8')); }
  catch { throw new HttpError(400, 'Request must contain valid JSON.'); }
  return schema.parse(data);
}
const emptyBody = z.object({}).strict();
async function createSession(db, user, production) {
  const raw = token(), csrf_token = token();
  await db.query(`INSERT INTO nc.sessions(token_hash,user_id,csrf_token,expires_at) VALUES($1,$2,$3,now()+interval '8 hours')`, [hash(raw),user.id,csrf_token]);
  return json({ user: { id: user.id, role: user.role, email: user.email, display_name:user.display_name, must_change_password:!!user.must_change_password }, csrf_token }, 200,
    { 'Set-Cookie': sessionCookie(raw, production) });
}
export function createAPI(db, config, clock) {
  const service = new InternshipService(db, config, clock);
  return async function handle(request, { ip = 'unknown' } = {}) {
    try {
      const url = new URL(request.url), method = request.method;
      const path = url.pathname.replace(/^\/\.netlify\/functions\/internships/, '/api').replace(/\/$/, '');
      assert(path.startsWith('/api/'), 404, 'Endpoint not found.');
      const mutation = !['GET','HEAD'].includes(method);
      if (mutation) {
        assert(request.headers.get('origin') === config.appOrigin, 403, 'Requests must come from the Nextora application.');
        assert(request.headers.get('sec-fetch-site') !== 'cross-site', 403, 'Cross-site requests are not allowed.');
      }
      await rateLimit(db, `ip:${ip}`, 180, 60, config.rateSecret);

      if (path.startsWith('/api/verify/') && method === 'GET') {
        await rateLimit(db, `verify:${ip}`, 30, 60, config.rateSecret);
        const number = path.slice('/api/verify/'.length).toUpperCase();
        const c = certificatePattern.test(number)
          ? (await db.query('SELECT certificate_number,snapshot,status,issued_at FROM nc.certificates WHERE certificate_number=$1', [number])).rows[0] : null;
        return c ? json(publicCertificate(c)) : json({ status: 'NOT_FOUND', message: 'The certificate ID provided could not be verified as a certificate issued through this system.' }, 404);
      }
      const publicResult=await publicExtension({db,path,method,url,request,body,json,config,ip,service});
      if(publicResult) return publicResult;
      if (path === '/api/auth/login' && method === 'POST') {
        await rateLimit(db, `login:${ip}`, 10, 900, config.rateSecret);
        const input = await body(request, z.object({ email, password: z.string().min(1).max(128) }).strict());
        await rateLimit(db, `account:${input.email}`, 15, 900, config.rateSecret);
        const user = (await db.query('SELECT * FROM nc.users WHERE email=$1', [input.email])).rows[0];
        const valid = await checkPassword(input.password, user?.password_hash);
        assert(valid && !user.disabled, 401, 'The email or password is incorrect.');
        return await db.transaction(async tx => { if(user.role==='ADMIN') await audit(tx,'ADMIN_LOGIN',user.id); return createSession(tx,user,config.production); });
      }
      if (path === '/api/auth/activate' && method === 'POST') {
        await rateLimit(db, `activate:${ip}`, 10, 900, config.rateSecret);
        const input = await body(request, z.object({ email, password, token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict());
        const passwordHash = await hashPassword(input.password);
        return await db.transaction(async tx => {
          const invitation = (await tx.query(`SELECT t.*,u.email,u.role,u.disabled FROM nc.invitations t JOIN nc.users u ON u.id=t.user_id
            WHERE t.token_hash=$1 AND t.used_at IS NULL AND t.expires_at > now() FOR UPDATE OF t,u`, [hash(input.token)])).rows[0];
          assert(invitation && invitation.email === input.email && invitation.role === 'STUDENT' && !invitation.disabled, 400,
            'This invitation is invalid or expired. Contact Nextora Creations for a new invitation.');
          await tx.query('UPDATE nc.users SET password_hash=$2 WHERE id=$1', [invitation.user_id,passwordHash]);
          await tx.query('UPDATE nc.invitations SET used_at=now() WHERE user_id=$1 AND used_at IS NULL', [invitation.user_id]);
          await tx.query('DELETE FROM nc.sessions WHERE user_id=$1', [invitation.user_id]);
          await tx.query(`UPDATE nc.internships SET status='REGISTERED',updated_at=now() WHERE status='INVITED'
            AND student_id=(SELECT id FROM nc.students WHERE user_id=$1)`, [invitation.user_id]);
          await audit(tx, 'ACCOUNT_ACTIVATED', invitation.user_id);
          return createSession(tx, { id: invitation.user_id, email: invitation.email, role: invitation.role }, config.production);
        });
      }

      const actor = await authenticate(db, request, config.production);
      if (mutation) assert(request.headers.get('x-csrf-token') === actor.csrf_token, 403, 'Your security token has expired. Refresh the page.');
      if (path === '/api/auth/me' && method === 'GET') {
        return json({ user: { id: actor.id, email: actor.email, role: actor.role, display_name:actor.display_name, must_change_password:!!actor.must_change_password }, csrf_token: actor.csrf_token });
      }
      if (path === '/api/auth/logout' && method === 'POST') {
        await body(request, emptyBody);
        await db.transaction(async tx=>{await tx.query('DELETE FROM nc.sessions WHERE token_hash=$1',[actor.token_hash]);if(actor.role==='ADMIN') await audit(tx,'ADMIN_LOGOUT',actor.id);});
        return json({ success: true }, 200, { 'Set-Cookie': sessionCookie('', config.production, 0) });
      }
      if (path === '/api/auth/password' && method === 'POST') {
        await rateLimit(db, `password:${actor.id}`, 5, 900, config.rateSecret);
        const input = await body(request, z.object({ current_password: z.string().min(1).max(128), password }).strict());
        await db.transaction(async tx => {
          const user = (await tx.query('SELECT * FROM nc.users WHERE id=$1 FOR UPDATE', [actor.id])).rows[0];
          assert(await checkPassword(input.current_password, user.password_hash), 401, 'The current password is incorrect.');
          assert(input.password!==input.current_password,400,'Choose a different password from the temporary password.');
          await tx.query('UPDATE nc.users SET password_hash=$2,must_change_password=false WHERE id=$1', [actor.id,await hashPassword(input.password)]);
          await tx.query('DELETE FROM nc.sessions WHERE user_id=$1', [actor.id]);
          await audit(tx, 'PASSWORD_CHANGED', actor.id);
        });
        return json({ success: true }, 200, { 'Set-Cookie': sessionCookie('', config.production, 0) });
      }
      assert(!actor.must_change_password,403,'Change your temporary password before continuing.','PASSWORD_CHANGE_REQUIRED');
      if (path.startsWith('/api/admin/')) assert(actor.role === 'ADMIN', 403, 'Company administrator access is required.');

      if (path === '/api/admin/programs' && method === 'GET') return json({ programs: (await db.query('SELECT * FROM nc.programs ORDER BY title LIMIT 200')).rows });
      const extension=await privateExtension({db,path,method,url,request,body,json,config,ip,service,actor});
      if(extension) return extension;
      if(path==='/api/admin/programs'&&method==='POST') return json(await saveProgram(db,actor,await body(request,programSchema)),201);
      const programMatch=path.match(/^\/api\/admin\/programs\/([^/]+)$/);
      if(programMatch&&method==='PATCH') return json(await saveProgram(db,actor,await body(request,programSchema),uuid.parse(programMatch[1])));
      if (path === '/api/admin/summary' && method === 'GET') {
        return json((await db.query(`SELECT count(DISTINCT student_id)::int AS total,
          count(DISTINCT student_id) FILTER (WHERE status='ACTIVE')::int AS active,
          count(*) FILTER (WHERE status IN ('COMPLETED','CERTIFICATE_ELIGIBLE','CERTIFICATE_ISSUED','CERTIFICATE_REVOKED'))::int AS completed,
          count(*) FILTER (WHERE status='CERTIFICATE_ELIGIBLE')::int AS eligible,
          count(*) FILTER (WHERE status IN ('CERTIFICATE_ISSUED','CERTIFICATE_REVOKED'))::int AS issued,
          count(*) FILTER (WHERE status='CERTIFICATE_REVOKED')::int AS revoked FROM nc.internships`)).rows[0]);
      }
      if (path === '/api/admin/internships' && method === 'POST') {
        return json(await service.createInternship(actor, await body(request, createInternshipSchema)), 201);
      }
      if (['/api/admin/internships','/api/me/internships'].includes(path) && method === 'GET') {
        const admin = path.includes('/admin/');
        const search = z.string().max(100).parse(url.searchParams.get('search') || '');
        const status = z.enum(['',...states]).parse(url.searchParams.get('status') || '');
        const page = z.coerce.number().int().min(1).max(100000).parse(url.searchParams.get('page') || 1);
        const values = [admin ? null : actor.id, `%${search.replace(/[\\%_]/g, '\\$&')}%`, status];
        const where = ` WHERE ($1::uuid IS NULL OR s.user_id=$1) AND (s.full_name ILIKE $2 OR u.email ILIKE $2 OR i.id::text ILIKE $2)
          AND ($3='' OR i.status=$3)`;
        const records = (await db.query(`${joinedInternships}${where} ORDER BY i.created_at DESC LIMIT 25 OFFSET $4`, [...values,(page-1)*25])).rows;
        const count = (await db.query(`SELECT count(*)::int AS total FROM nc.internships i JOIN nc.students s ON s.id=i.student_id JOIN nc.users u ON u.id=s.user_id${where}`, values)).rows[0].total;
        return json({ internships: records.map(i => ({ ...i, ...eligibility(i, service.today()) })), total: count, page });
      }

      const match = path.match(/^\/api\/(admin|me)\/internships\/([^/]+)(?:\/(details|status|issue|pdf|revoke|regenerate|history|invite))?$/);
      if (match) {
        const [, area, rawId, action] = match, id = uuid.parse(rawId);
        const admin = area === 'admin';
        if (!action && method === 'GET') {
          const i = await service.record(db, id, actor);
          return json({ internship: { ...i, ...eligibility(i, service.today()) } });
        }
        if (!action && method === 'PATCH' && admin) return json({ internship: await service.editInternship(actor, id, await body(request, internshipFields)) });
        if (action === 'details' && method === 'PATCH' && !admin) return json({ internship: await service.confirmDetails(actor, id, await body(request, profileSchema)) });
        if (action === 'status' && method === 'POST' && admin) {
          const input = await body(request, z.object({ status: z.enum(states) }).strict());
          return json({ internship: await service.transition(actor, id, input.status) });
        }
        if (action === 'issue' && method === 'POST') {
          await body(request, emptyBody);
          await rateLimit(db, `issue:${actor.id}`, 10, 60, config.rateSecret);
          return json(await service.issue(actor, id));
        }
        if (action === 'pdf' && method === 'GET') {
          const pdf = await service.pdf(actor, id);
          const disposition = url.searchParams.get('view') === '1' ? 'inline' : 'attachment';
          return new Response(pdf.bytes, { headers: { ...baseHeaders, 'Content-Type': 'application/pdf',
            'Content-Disposition': `${disposition}; filename="${pdf.filename}"` } });
        }
        if (action === 'regenerate' && method === 'POST' && admin) {
          await body(request, emptyBody);
          await rateLimit(db, `issue:${actor.id}`, 10, 60, config.rateSecret);
          return json(await service.regenerate(actor, id));
        }
        if (action === 'revoke' && method === 'POST' && admin) {
          const { reason } = await body(request, z.object({ reason: z.string().trim().min(5).max(500) }).strict());
          return json(await service.revoke(actor, id, reason));
        }
        if (action === 'history' && method === 'GET' && admin) {
          await service.record(db, id, actor);
          const before = z.string().uuid().nullable().parse(url.searchParams.get('before'));
          return json({ history: (await db.query(`SELECT id,event,actor_id,certificate_id,metadata,created_at FROM nc.audit_logs
            WHERE internship_id=$1 AND ($2::uuid IS NULL OR (created_at,id) < (SELECT created_at,id FROM nc.audit_logs WHERE id=$2))
            ORDER BY created_at DESC,id DESC LIMIT 100`, [id,before])).rows });
        }
        if (action === 'invite' && method === 'POST' && admin) {
          await body(request, emptyBody);
          return json(await db.transaction(async tx => {
            const i = await service.record(tx, id, actor, true);
            const user = (await tx.query('SELECT * FROM nc.users WHERE id=$1 FOR UPDATE', [i.user_id])).rows[0];
            assert(!user.disabled, 409, 'This account is disabled.');
            const invitation_url = await service.invitation(tx, i.user_id);
            await audit(tx, 'INVITATION_CREATED', actor.id, id);
            return { invitation_url };
          }));
        }
      }
      throw new HttpError(404, 'Endpoint not found.');
    } catch (error) {
      if (error instanceof ZodError) return json({ error: 'Please check the form values.', code: 'VALIDATION_ERROR',
        fields: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) }, 400);
      if (error instanceof HttpError) return json({ error: error.message, code: error.code }, error.status,
        error.status === 429 ? { 'Retry-After': '900' } : {});
      if (error.code === '23505') return json({ error: 'This record already exists. Refresh and try again.' }, 409);
      // Do not log request bodies, database errors, passwords or connection strings.
      console.error('Internship API failure', { type: error.name, code: error.code || 'INTERNAL' });
      return json({ error: 'The internship service is temporarily unavailable. Please try again later.' }, 503);
    }
  };
}
