import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { hashPassword, hash } from '../server/auth.js';
import { defaults } from '../server/templates.js';
import { testProgram, testPassword, internshipInput, testSignature } from './fixtures.js';

export async function extensionTests(t,{db,request,post,admin,student,transition}) {
  let programId,intern,offer,certificate,templateId;
  await t.test('bootstrap administrator must rotate password; expired sessions are rejected',async()=>{
    const id=randomUUID();await db.query("INSERT INTO nc.users(id,email,role,password_hash,must_change_password,display_name) VALUES($1,'bootstrap@example.test','ADMIN',$2,true,'admin')",[id,await hashPassword(testPassword)]);
    const r=await post('/auth/login',{email:'bootstrap@example.test',password:testPassword},null);
    const s={...r.result,cookie:r.response.headers.get('set-cookie').split(';')[0]};
    assert.equal(s.user.must_change_password,true);
    assert.equal((await request('/admin/dashboard',{session:s})).result.code,'PASSWORD_CHANGE_REQUIRED');
    assert.equal((await post('/auth/password',{current_password:testPassword,password:testPassword},s)).status,400);
    assert.equal((await post('/auth/password',{current_password:testPassword,password:'Rotated-test-only-password!'},s)).status,200);
    assert.equal((await request('/auth/me',{session:s})).status,401);
    const fresh=await post('/auth/login',{email:'bootstrap@example.test',password:'Rotated-test-only-password!'},null);
    assert.equal(fresh.result.user.must_change_password,false);
    const fs={...fresh.result,cookie:fresh.response.headers.get('set-cookie').split(';')[0]};
    await db.query("UPDATE nc.sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1",[id]);
    assert.equal((await request('/admin/dashboard',{session:fs})).status,401);
  });
  await t.test('program drafts, publishing, public details and private applications work',async()=>{
    const input={...testProgram,slug:'extension-marketing',status:'DRAFT',role:'Marketing Intern',responsibilities:'Research markets\nPresent findings',skills:'Communication',eligibility:'MBA student',work_mode:'REMOTE',positions:5,applications_enabled:true};
    const r=await post('/admin/programs',input);assert.equal(r.status,201,JSON.stringify(r.result));programId=r.result.id;
    assert.equal((await request('/programs/extension-marketing')).status,404);
    assert.equal((await request(`/admin/programs/${programId}`,{method:'PATCH',data:{...input,status:'PUBLISHED'},session:admin})).status,200);
    assert.ok((await request('/programs')).result.programs.some(p=>p.id===programId));
    const p=(await request('/programs/extension-marketing')).result.program;assert.equal(p.work_mode,'REMOTE');assert.ok(!('created_at' in p));
    const application={student:internshipInput(programId).student,motivation:'Learn through practical work'};
    assert.equal((await post('/programs/extension-marketing/applications',application,null)).status,202);
    assert.equal((await post('/programs/extension-marketing/applications',application,null)).status,202);
    assert.equal((await request('/admin/applications',{session:student})).status,403);
    const a=(await request('/admin/applications',{session:admin})).result.applications.find(a=>a.email===application.student.email);
    const accepted=await request(`/admin/applications/${a.id}`,{method:'PATCH',session:admin,data:{status:'ACCEPTED',internship:internshipInput(programId).internship}});
    assert.equal(accepted.status,200,JSON.stringify(accepted.result));intern=accepted.result.internship;
    assert.equal(intern.status,'REGISTERED');assert.equal(intern.workflow_version,2);
    assert.equal((await request(`/admin/applications/${a.id}`,{method:'PATCH',session:admin,data:{status:'ACCEPTED',internship:internshipInput(programId).internship}})).status,409);
  });
  await t.test('new lifecycle requires approval and offer; concurrent offer issuance is idempotent',async()=>{
    assert.equal((await transition(intern.id,'ACTIVE')).status,409);
    assert.equal((await transition(intern.id,'CERTIFICATE_ISSUED')).status,409);
    assert.equal((await post(`/admin/internships/${intern.id}/offer`)).status,409);
    assert.equal((await transition(intern.id,'APPROVED')).status,200);
    assert.equal((await post(`/admin/internships/${intern.id}/offer`,{},student)).status,403);
    const results=await Promise.all([post(`/admin/internships/${intern.id}/offer`),post(`/admin/internships/${intern.id}/offer`)]);
    results.forEach(r=>assert.equal(r.status,200,JSON.stringify(r.result)));offer=results[0].result;
    assert.equal(results[1].result.offer_number,offer.offer_number);
    assert.match(offer.offer_number,/^NC-OFFER-2026-[A-F0-9]{24}$/);
    const v=await request(`/verify-offer/${offer.offer_number}`);assert.equal(v.result.status,'VERIFIED');
    assert.deepEqual(Object.keys(v.result).sort(),['status','offer_number','student_name','program','role','start_date','end_date','issued_at','issuer'].sort());
    assert.equal((await request(`/me/internships/${intern.id}/offer-pdf`,{session:student})).status,404);
    await assert.rejects(db.query("UPDATE nc.offer_letters SET snapshot='{}' WHERE internship_id=$1",[intern.id]),/immutable/);
    assert.equal((await request(`/admin/internships/${intern.id}`,{method:'PATCH',session:admin,data:internshipInput(programId).internship})).status,409);
  });
  await t.test('portrait offer PDF contains authoritative text, private signature and scannable QR',async()=>{
    const r=await request(`/admin/internships/${intern.id}/offer-pdf`,{session:admin});assert.equal(r.status,200);
    const {getDocument,OPS}=await import('pdfjs-dist/legacy/build/pdf.mjs');const loading=getDocument({data:new Uint8Array(r.result),useSystemFonts:true}),doc=await loading.promise,page=await doc.getPage(1);
    assert.equal(doc.numPages,1);assert.ok(Math.abs(page.view[2]-595.28)<.1);assert.ok(Math.abs(page.view[3]-841.89)<.1);
    const text=(await page.getTextContent()).items.map(i=>i.str).join(' ');
    for(const value of [offer.offer_number,intern.full_name,intern.college_name,intern.program_title,intern.role,'REMOTE','Gorke Sai Kumar'])assert.ok(text.includes(value),value);
    assert.equal((await page.getOperatorList()).fnArray.filter(x=>x===OPS.paintImageXObject).length,3);
    const {createCanvas}=await import('@napi-rs/canvas'),{default:jsQR}=await import('jsqr');const viewport=page.getViewport({scale:2}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height)),context=canvas.getContext('2d');
    await page.render({canvasContext:context,viewport}).promise;const decoded=jsQR(context.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
    assert.equal(decoded?.data,`https://nextoracreations.co.in/verify-offer/${offer.offer_number}`);
    await writeFile('tmp/offer-test.pdf',r.result);await writeFile('tmp/offer-test.png',canvas.toBuffer('image/png'));await loading.destroy();
  });
  await t.test('template drafts, previews, activation, conflict checks and injection protection',async()=>{
    assert.equal((await request('/admin/templates',{session:student})).status,403);
    for(const text of ['<script>alert(1)</script>','{{unknown}}','{{ offer_id }}'])assert.equal((await post('/admin/templates',{name:'Bad',kind:'CERTIFICATE',config:{...defaults('CERTIFICATE'),body:text}})).status,400);
    const r=await post('/admin/templates',{name:'Approved certificate layout',kind:'CERTIFICATE'});assert.equal(r.status,201,JSON.stringify(r.result));templateId=r.result.id;
    const config={...defaults('CERTIFICATE'),font:'NOTO_SERIF',footer:'Official record from {{company_name}}'};
    const preview=await post('/admin/templates/preview',{kind:'CERTIFICATE',config});assert.equal(preview.status,200);assert.equal(preview.result.subarray(0,5).toString(),'%PDF-');
    await writeFile('tmp/template-preview.pdf',preview.result);
    const changed=await request(`/admin/templates/${templateId}`,{method:'PATCH',session:admin,data:{name:'Approved certificate layout',config,revision:1}});assert.equal(changed.status,200);
    assert.equal((await post(`/admin/templates/${templateId}/activate`,{revision:1})).status,409);
    assert.equal((await post(`/admin/templates/${templateId}/activate`,{revision:2})).status,200);
    assert.equal((await post(`/admin/templates/${templateId}/duplicate`,{revision:3})).status,200);
    await assert.rejects(db.query('DELETE FROM nc.template_revisions'),/immutable/);
  });
  await t.test('offer activation through approved certificate and immutable template snapshot',async()=>{
    for(const status of ['ACTIVE','COMPLETED','CERTIFICATE_ELIGIBLE'])assert.equal((await transition(intern.id,status)).status,200);
    const r=await post(`/admin/internships/${intern.id}/issue`);assert.equal(r.status,200,JSON.stringify(r.result));certificate=r.result;
    assert.equal((await request(`/verify/${certificate.certificate_number}`)).result.student_name,intern.full_name);
    const before=(await request(`/admin/internships/${intern.id}/pdf`,{session:admin})).result;
    await post(`/admin/templates/${templateId}/reset`,{revision:3});await post(`/admin/templates/${templateId}/activate`,{revision:4});
    const after=(await request(`/admin/internships/${intern.id}/pdf`,{session:admin})).result;assert.equal(hash(before),hash(after));
    const snapshot=(await db.query('SELECT snapshot FROM nc.certificates WHERE internship_id=$1',[intern.id])).rows[0].snapshot;assert.equal(snapshot.document_template.font,'NOTO_SERIF');
    await writeFile('tmp/certificate-serif-test.pdf',after);
    const d=await request('/admin/dashboard',{session:admin});assert.equal(d.status,200);assert.ok(d.result.counts.offers>=1);
    const filtered=await request(`/admin/interns?program_id=${programId}&certificate_status=VALID&offer_status=VALID&search=Test`,{session:admin});assert.equal(filtered.result.total,1);
  });
  await t.test('company assets are admin-only, metadata-only and auditable',async()=>{
    const png=(await testSignature()).toString('base64');
    assert.equal((await post('/admin/company-assets/upload',{name:'authorized_signature',png_base64:png},student)).status,403);
    assert.equal((await post('/admin/company-assets/upload',{name:'authorized_signature',png_base64:png})).status,200);
    const r=await request('/admin/company-assets',{session:admin});assert.equal(r.status,200);
    assert.ok(!JSON.stringify(r.result).includes(png));assert.ok(!('png' in r.result.assets[0]));
    assert.equal((await post('/admin/company-assets/upload',{name:'authorized_signature',png_base64:'ZmFrZQ=='})).status,400);
    const logs=(await request('/admin/audit-logs?search=SIGNATURE_UPDATED',{session:admin})).result.logs;assert.ok(logs.length);assert.ok(!JSON.stringify(logs).includes(png));
    assert.equal((await request('/admin/company-assets',{session:student})).status,403);
    assert.equal((await request('/verify-offer/INVALID')).status,404);
    assert.equal((await post(`/admin/internships/${intern.id}/offer-revoke`,{reason:'Test offer revocation'})).status,200);
    assert.equal((await request(`/verify-offer/${offer.offer_number}`)).result.status,'REVOKED');
    assert.equal((await request(`/admin/internships/${intern.id}/offer-pdf`,{session:admin})).status,409);
  });
}
