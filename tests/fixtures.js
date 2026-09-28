import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { hashPassword } from '../server/auth.js';
export const testPassword='Test-only-passphrase-2026!';
export const testProgram={title:'MBA Marketing Internship',description:'Practical marketing research and strategy experience.',department:'Marketing',duration_months:3,minimum_duration_months:3,start_date:null,end_date:null,status:'ACTIVE',certificate_template:'nextora-v1'};
export function internshipInput(programId, overrides={}) {
  return {student:{email:`student-${randomUUID()}@example.test`,full_name:'Test Student',phone_number:'555-0101',college_name:'Test College',university_name:'Test University',course:'MBA',specialization:'Marketing',registration_number:'TEST-123'},
    internship:{program_id:programId,role:'Marketing Intern',department:'Marketing',start_date:'2026-01-31',end_date:'2026-04-30',mentor:'Test Supervisor',project:'Marketing research',...overrides}};
}
export async function testSignature() {
  const bytes=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><rect width="400" height="100" fill="white"/><text x="12" y="40" font-family="Arial" font-size="24" fill="#b22222">TEST FIXTURE ONLY</text><text x="12" y="76" font-family="Arial" font-size="18" fill="#b22222">NOT AN AUTHORIZED SIGNATURE</text></svg>')).png().toBuffer();
  await mkdir('tmp',{recursive:true}); await writeFile('tmp/test-signature.png',bytes);
  return bytes;
}
export async function seedAdmin(db) {
  const id=randomUUID();
  await db.query("INSERT INTO nc.users(id,email,password_hash,role) VALUES($1,$2,$3,'ADMIN')",[id,'admin@example.test',await hashPassword(testPassword)]);
  return {id,email:'admin@example.test',role:'ADMIN'};
}
