import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { getDatabase } from '../server/db.js';
import { createAPI } from '../server/api.js';
import { migrate } from '../scripts/migrate.js';
import { testProgram, testPassword, internshipInput, testSignature, seedAdmin } from './fixtures.js';

test('PostgreSQL + real API + server PDF secure lifecycle',async t=>{
  assert.equal(process.env.NEXTORA_TEST_DATABASE,'true','Use npm test; never point integration tests at an existing database.');
  assert.equal(new URL(process.env.DATABASE_URL).pathname,'/nc_test');
  const db=getDatabase();
  t.after(()=>db.close());
  await migrate(db); await migrate(db);
  await db.query('CREATE ROLE nc_app NOLOGIN');
  await db.query((await readFile('server/runtime-grants.sql','utf8')).replaceAll(':"app_role"','"nc_app"'));
  const runtime={
    query: (sql,args)=>db.transaction(async tx=>{await tx.query('SET LOCAL ROLE nc_app');return tx.query(sql,args);}),
    transaction: fn=>db.transaction(async tx=>{await tx.query('SET LOCAL ROLE nc_app');return fn(tx);}),
  };
  const adminUser=await seedAdmin(db);
  const config={production:false,appOrigin:'http://localhost:5173',officialOrigin:'https://nextoracreations.co.in',rateSecret:'test-only-rate-secret',signatureBase64:(await testSignature()).toString('base64')};
  const handler=createAPI(runtime,config,()=>new Date('2026-09-28T12:00:00Z'));
  let ipCounter=0;
  async function request(path,options={}) {
    const {method='GET',data,session,origin=config.appOrigin,csrf=session?.csrf_token,ip=`test-${++ipCounter}`,api=handler}=options;
    const headers={...(method!=='GET'?{'Origin':origin}:{}),...(data!==undefined?{'Content-Type':'application/json'}:{}),...(session?{'Cookie':session.cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})};
    const response=await api(new Request(`${config.appOrigin}${path.startsWith('/.netlify')?'':'/api'}${path}`,{method,headers,...(data!==undefined?{body:JSON.stringify(data)}:{})}),{ip});
    const contentType=response.headers.get('content-type');
    const result=contentType?.includes('json')?await response.json():Buffer.from(await response.arrayBuffer());
    return {response,result,status:response.status};
  }
  const login=await request('/auth/login',{method:'POST',data:{email:'admin@example.test',password:testPassword}});
  assert.equal(login.status,200);
  const admin={...login.result,cookie:login.response.headers.get('set-cookie').split(';')[0]};
  assert.match(login.response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  const createdProgram=await request('/admin/programs',{method:'POST',data:testProgram,session:admin});
  assert.equal(createdProgram.status,201,JSON.stringify(createdProgram.result));
  const programId=createdProgram.result.id;
  let student,record,cert;
  const post=(path,data={},session=admin,extra={})=>request(path,{method:'POST',data,session,...extra});
  const create=async(overrides={})=>{
    const input=internshipInput(programId,overrides);
    const out=await post('/admin/internships',input); assert.equal(out.status,201,JSON.stringify(out.result));
    return {input,...out.result};
  };
  const transition=(id,status)=>post(`/admin/internships/${id}/status`,{status});
  await t.test('unauthorized, student-role, CSRF and cross-origin requests are blocked',async()=>{
    assert.equal((await request('/admin/internships')).status,401);
    assert.equal((await post('/admin/programs',testProgram,admin,{csrf:'wrong'})).status,403);
    assert.equal((await post('/auth/login',{email:'admin@example.test',password:testPassword},null,{origin:'https://evil.example'})).status,403);
    assert.equal((await post('/auth/login',{email:'missing@example.test',password:'bad'},null)).status,401);
  });
  await t.test('invitation is email-bound, single-use, private and activates student',async()=>{
    const created=await create(); record=created.internship;
    const raw=new URL(created.invitation_url).hash.slice('#invite='.length);
    assert.ok(raw.length>=43);
    assert.equal((await post('/auth/activate',{email:'other@example.test',password:testPassword,token:raw},null)).status,400);
    const activation=await post('/auth/activate',{email:created.input.student.email,password:testPassword,token:raw},null);
    assert.equal(activation.status,200,JSON.stringify(activation.result));
    student={...activation.result,cookie:activation.response.headers.get('set-cookie').split(';')[0]};
    assert.equal((await post('/auth/activate',{email:created.input.student.email,password:testPassword,token:raw},null)).status,400);
    assert.equal((await request('/admin/internships',{session:student})).status,403);
    assert.equal((await post(`/admin/internships/${record.id}/status`,{status:'CERTIFICATE_ELIGIBLE'},student)).status,403);
    const stored=(await db.query('SELECT token_hash FROM nc.invitations WHERE user_id=$1',[student.user.id])).rows[0];
    assert.notEqual(stored.token_hash,raw);
  });
  await t.test('unapproved completed record and incomplete duration cannot issue',async()=>{
    assert.equal((await transition(record.id,'ACTIVE')).status,200);
    assert.equal((await post(`/me/internships/${record.id}/issue`,{},student)).status,403);
    assert.equal((await transition(record.id,'COMPLETED')).status,200);
    assert.equal((await post(`/me/internships/${record.id}/issue`,{},student)).status,403);
    const early=await create({start_date:'2026-08-01',end_date:'2026-11-01'});
    await transition(early.internship.id,'ACTIVE');
    assert.equal((await transition(early.internship.id,'COMPLETED')).status,409);
    assert.equal((await post(`/admin/internships/${early.internship.id}/issue`)).status,403);
    const short=await create({start_date:'2026-01-31',end_date:'2026-04-29'});
    await transition(short.internship.id,'ACTIVE');
    assert.equal((await transition(short.internship.id,'COMPLETED')).status,409);
  });
  await t.test('student owns only their records and cannot submit dates or approval',async()=>{
    const other=await create();
    for(const suffix of ['', '/pdf']) assert.equal((await request(`/me/internships/${other.internship.id}${suffix}`,{session:student})).status,404);
    assert.equal((await post(`/me/internships/${other.internship.id}/issue`,{},student)).status,404);
    const profile={full_name:'Test Student',phone_number:'555',college_name:'Example College',university_name:'Example University',course:'MBA',specialization:'Marketing',registration_number:'TEST-100'};
    assert.equal((await request(`/me/internships/${record.id}/details`,{method:'PATCH',data:{...profile,admin_approved:true,start_date:'2020-01-01'},session:student})).status,400);
    assert.equal((await request(`/me/internships/${record.id}/details`,{method:'PATCH',data:profile,session:student})).status,200);
    assert.equal((await request(`/me/internships/${record.id}/details`,{method:'PATCH',data:{...profile,full_name:'Bad\u0000Name'},session:student})).status,400);
  });
  await t.test('approval and approved profile lock are enforced; signature absence fails closed',async()=>{
    assert.equal((await transition(record.id,'CERTIFICATE_ELIGIBLE')).status,200);
    const result=await request(`/me/internships/${record.id}`,{session:student});
    assert.equal(result.result.internship.eligible,true);
    const {email,...profile}=internshipInput(programId).student;
    assert.equal((await request(`/me/internships/${record.id}/details`,{method:'PATCH',data:profile,session:student})).status,409);
    const noSignature=createAPI(runtime,{...config,signatureBase64:undefined},()=>new Date('2026-09-28T12:00:00Z'));
    assert.equal((await post(`/me/internships/${record.id}/issue`,{},student,{api:noSignature})).status,503);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM nc.certificates WHERE internship_id=$1',[record.id])).rows[0].count,0);
  });
  await t.test('concurrent issuance returns a single certificate and exactly one initial PDF',async()=>{
    const outputs=await Promise.all(Array.from({length:5},()=>post(`/me/internships/${record.id}/issue`,{},student)));
    outputs.forEach(o=>assert.equal(o.status,200,JSON.stringify(o.result)));
    assert.equal(new Set(outputs.map(o=>o.result.certificate_number)).size,1);
    cert=outputs[0].result;
    assert.match(cert.certificate_number,/^NC-INT-2026-[A-F0-9]{24}$/);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM nc.certificates WHERE internship_id=$1',[record.id])).rows[0].count,1);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM nc.certificate_pdfs')).rows[0].count,1);
  });
  await t.test('public verification redacts private fields and correct official QR URL is persisted',async()=>{
    const verified=await request(`/verify/${cert.certificate_number}`);
    assert.equal(verified.status,200); assert.equal(verified.result.status,'VERIFIED');
    assert.deepEqual(Object.keys(verified.result).sort(),['status','certificate_number','student_name','role','program','start_date','end_date','issued_at','issuer'].sort());
    const stored=(await db.query('SELECT verification_url FROM nc.certificates WHERE internship_id=$1',[record.id])).rows[0];
    assert.equal(stored.verification_url,`https://nextoracreations.co.in/verify-certificate/${cert.certificate_number}`);
    assert.equal((await request('/verify/NC-INT-2026-FFFFFFFFFFFFFFFFFFFFFFFF')).result.status,'NOT_FOUND');
    assert.equal((await request('/verify/1')).result.status,'NOT_FOUND');
    assert.equal((await request(`/.netlify/functions/internships/verify/${cert.certificate_number}`)).result.status,'VERIFIED');
    assert.equal(verified.response.headers.get('cache-control'),'no-store, private');
  });
  await t.test('genuine vector PDF has correct A4 size, text, company assets and stored ID',async()=>{
    const response=await request(`/me/internships/${record.id}/pdf`,{session:student});
    assert.equal(response.status,200); assert.equal(response.result.subarray(0,5).toString(),'%PDF-');
    assert.match(response.response.headers.get('content-disposition'),/Nextora-Creations-Internship-Certificate-Test-Student-/);
    const {getDocument,OPS}=await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loading=getDocument({data:new Uint8Array(response.result),useSystemFonts:true});
    const doc=await loading.promise;
    assert.equal(doc.numPages,1);
    const page=await doc.getPage(1);
    assert.ok(Math.abs(page.view[2]-841.89)<0.1); assert.ok(Math.abs(page.view[3]-595.28)<0.1);
    const text=(await page.getTextContent()).items.map(i=>i.str).join(' ');
    for(const part of ['Test Student','Marketing Intern','MBA Marketing Internship','31 Jan 2026','30 Apr 2026',cert.certificate_number,'Gorke Sai Kumar','https://nextoracreations.co.in/verify-certificate/']) assert.ok(text.includes(part),part);
    const ops=await page.getOperatorList(); assert.equal(ops.fnArray.filter(op=>op===OPS.paintImageXObject).length,3,'Logo, controlled signature and QR are embedded');
    const {createCanvas}=await import('@napi-rs/canvas');
    const {default:jsQR}=await import('jsqr');
    const viewport=page.getViewport({scale:2});
    const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
    const context=canvas.getContext('2d');
    await page.render({canvasContext:context,viewport}).promise;
    const pixels=context.getImageData(0,0,canvas.width,canvas.height);
    const decoded=jsQR(pixels.data,canvas.width,canvas.height);
    assert.equal(decoded?.data,`https://nextoracreations.co.in/verify-certificate/${cert.certificate_number}`,'Actual rendered PDF QR decodes to the official URL');
    await writeFile('tmp/certificate-test.pdf',response.result);
    await loading.destroy();
  });
  await t.test('issued snapshots and audit history remain immutable; regeneration creates a revision',async()=>{
    const profile=internshipInput(programId).student; delete profile.email; profile.full_name='Changed Profile Name';
    assert.equal((await request(`/me/internships/${record.id}/details`,{method:'PATCH',data:profile,session:student})).status,200);
    assert.equal((await request(`/verify/${cert.certificate_number}`)).result.student_name,'Test Student');
    const owned=await request(`/me/internships/${record.id}`,{session:student});
    assert.equal(owned.result.internship.certificate_student_name,'Test Student');
    assert.ok(!JSON.stringify(owned.result).includes('signature_png'));
    assert.equal((await request(`/admin/internships/${record.id}`,{method:'PATCH',data:internshipInput(programId).internship,session:admin})).status,409);
    const regen=await post(`/admin/internships/${record.id}/regenerate`); assert.equal(regen.status,200); assert.equal(regen.result.revision,2); assert.equal(regen.result.certificate_number,cert.certificate_number);
    await assert.rejects(db.query("UPDATE nc.certificates SET snapshot='{}' WHERE internship_id=$1",[record.id]),/immutable/);
    await assert.rejects(db.query('DELETE FROM nc.audit_logs WHERE internship_id=$1',[record.id]),/immutable/);
    await assert.rejects(db.query('DELETE FROM nc.certificate_pdfs'),/immutable/);
    const events=(await request(`/admin/internships/${record.id}/history`,{session:admin})).result.history.map(h=>h.event);
    for(const event of ['INTERNSHIP_CREATED','INTERNSHIP_COMPLETED','CERTIFICATE_APPROVED','CERTIFICATE_GENERATED','CERTIFICATE_DOWNLOADED','CERTIFICATE_REGENERATED']) assert.ok(events.includes(event),event);
    const logs=JSON.stringify((await db.query('SELECT metadata FROM nc.audit_logs')).rows);
    assert.ok(!logs.includes(testPassword)); assert.ok(!logs.includes('invite='));
  });
  await t.test('admin revocation is permanent, public and blocks issuance/download/regeneration',async()=>{
    assert.equal((await post(`/admin/internships/${record.id}/revoke`,{reason:'Issued to the wrong internship'},student)).status,403);
    assert.equal((await post(`/admin/internships/${record.id}/revoke`,{reason:'Issued to the wrong internship'})).status,200);
    assert.equal((await request(`/verify/${cert.certificate_number}`)).result.status,'REVOKED');
    assert.equal((await request(`/me/internships/${record.id}/pdf`,{session:student})).status,409);
    assert.equal((await post(`/me/internships/${record.id}/issue`,{},student)).status,409);
    assert.equal((await post(`/admin/internships/${record.id}/regenerate`)).status,409);
    await assert.rejects(db.query("UPDATE nc.certificates SET status='VALID' WHERE internship_id=$1",[record.id]),/immutable/);
    await assert.rejects(db.query('DELETE FROM nc.certificates WHERE internship_id=$1',[record.id]),/cannot be deleted/);
  });
  await t.test('program changes preserve enrollment requirements; edits clear approval',async()=>{
    const created=await create(); const id=created.internship.id;
    for(const s of ['ACTIVE','COMPLETED','CERTIFICATE_ELIGIBLE']) assert.equal((await transition(id,s)).status,200);
    const changed=await request(`/admin/programs/${programId}`,{method:'PATCH',data:{...testProgram,duration_months:6,minimum_duration_months:6},session:admin}); assert.equal(changed.status,200);
    const edit=await request(`/admin/internships/${id}`,{method:'PATCH',data:{...created.input.internship,role:'Marketing Research Intern'},session:admin});
    assert.equal(edit.status,200); assert.equal(edit.result.internship.admin_approved,false); assert.equal(edit.result.internship.status,'COMPLETED'); assert.equal(edit.result.internship.minimum_duration_months,3);
    const newer=await create(); assert.equal(newer.internship.minimum_duration_months,6);
  });
  await t.test('company signature can live privately in DB and issuance snapshots preserve its bytes',async()=>{
    const {hash}=await import('../server/auth.js');
    const sig=await testSignature();
    await db.query("INSERT INTO nc.company_assets(name,png,sha256,updated_by) VALUES('authorized_signature',$1,$2,$3)",[sig,hash(sig),adminUser.id]);
    const created=await create({start_date:'2026-01-01',end_date:'2026-07-01'});
    for(const s of ['ACTIVE','COMPLETED','CERTIFICATE_ELIGIBLE']) await transition(created.internship.id,s);
    const storedAssetsAPI=createAPI(runtime,{...config,signatureBase64:undefined},()=>new Date('2026-09-28T12:00:00Z'));
    const issued=await post(`/admin/internships/${created.internship.id}/issue`,{},admin,{api:storedAssetsAPI});
    assert.equal(issued.status,200,JSON.stringify(issued.result));
    const c=(await db.query('SELECT snapshot FROM nc.certificates WHERE internship_id=$1',[created.internship.id])).rows[0];
    assert.equal(c.snapshot.signature_sha256,hash(sig));
    assert.equal(c.snapshot.signature_png,sig.toString('base64'));
  });
  await t.test('verification rate limiting survives independent handler instances',async()=>{
    for(let n=0;n<30;n++) assert.equal((await request('/verify/INVALID',{ip:'same-verifier'})).status,404);
    const another=createAPI(runtime,config);
    const limited=await request('/verify/INVALID',{ip:'same-verifier',api:another});
    assert.equal(limited.status,429); assert.ok(limited.response.headers.get('retry-after'));
  });
  await t.test('password change revokes all sessions and logout invalidates session',async()=>{
    const changed=await post('/auth/password',{current_password:testPassword,password:'New-test-only-passphrase-2026!'},student);
    assert.equal(changed.status,200);
    assert.equal((await request('/me/internships',{session:student})).status,401);
    assert.equal((await post('/auth/logout')).status,200);
    assert.equal((await request('/admin/summary',{session:admin})).status,401);
  });
  await t.test('database unique and foreign key constraints exist',async()=>{
    const constraints=(await db.query("SELECT constraint_type FROM information_schema.table_constraints WHERE table_schema='nc' AND table_name='certificates'")).rows.map(x=>x.constraint_type);
    assert.ok(constraints.filter(c=>c==='UNIQUE').length>=2);
    assert.ok(constraints.includes('FOREIGN KEY'));
    const random=await request(`/verify/NC-INT-2026-${randomUUID().replaceAll('-','').slice(0,24).toUpperCase()}`); assert.equal(random.status,404);
    assert.ok(adminUser.id);
  });
  await t.test('runtime role cannot alter signatures, admin roles, schema or historical rows',async()=>{
    await assert.rejects(runtime.query("UPDATE nc.company_assets SET sha256='changed'"),/permission denied/);
    await assert.rejects(runtime.query("UPDATE nc.users SET role='ADMIN'"),/permission denied/);
    await assert.rejects(runtime.query('DELETE FROM nc.certificates'),/permission denied/);
    await assert.rejects(runtime.query('DELETE FROM nc.audit_logs'),/permission denied/);
    await assert.rejects(runtime.query('CREATE TABLE nc.unwanted(id integer)'),/permission denied/);
  });
});
