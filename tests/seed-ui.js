import { getDatabase } from '../server/db.js';
import { migrate } from '../scripts/migrate.js';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { testProgram, seedAdmin, testSignature, internshipInput, testPassword } from './fixtures.js';
import { InternshipService } from '../server/service.js';
import { hashPassword } from '../server/auth.js';
if(process.env.NEXTORA_TEST_DATABASE!=='true' || new URL(process.env.DATABASE_URL).pathname!=='/nc_test') throw new Error('Use isolated test runner.');
const db=getDatabase();
try {
  await migrate(db);
  const admin=await seedAdmin(db), pid=randomUUID();
  await db.query(`INSERT INTO nc.programs(id,title,description,department,status,slug) VALUES($1,$2,$3,$4,'ACTIVE','mba-marketing')`,[pid,testProgram.title,testProgram.description,testProgram.department]);
  await db.query("INSERT INTO nc.users(id,email,role,password_hash,must_change_password) VALUES($1,'bootstrap-ui@example.test','ADMIN',$2,true)",[randomUUID(),await hashPassword(testPassword)]);
  const sig=await testSignature();
  const service=new InternshipService(db,{appOrigin:'http://localhost:5173',officialOrigin:'https://nextoracreations.co.in',signatureBase64:sig.toString('base64')},()=>new Date('2026-09-28T12:00:00Z'));
  const input=internshipInput(pid); input.student.email='student@example.test';
  const {internship}=await service.createInternship(admin,{...input,workflow_version:1});
  await db.query('UPDATE nc.users SET password_hash=$2 WHERE id=$1',[internship.user_id,await hashPassword(testPassword)]);
  await service.transition(admin,internship.id,'ACTIVE');
  await service.transition(admin,internship.id,'COMPLETED');
  await service.transition(admin,internship.id,'CERTIFICATE_ELIGIBLE');
  const certificate=await service.issue(admin,internship.id);
  const revoked=await service.createInternship(admin,{...internshipInput(pid),workflow_version:1});
  for(const state of ['ACTIVE','COMPLETED','CERTIFICATE_ELIGIBLE']) await service.transition(admin,revoked.internship.id,state);
  const revokedCert=await service.issue(admin,revoked.internship.id);
  await service.revoke(admin,revoked.internship.id,'Test revocation');
  await writeFile('tmp/ui-fixture.json',JSON.stringify({internship_id:internship.id,certificate_number:certificate.certificate_number,revoked_number:revokedCert.certificate_number}));
} finally { await db.close(); }
