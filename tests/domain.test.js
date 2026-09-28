import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, eligibility, certificateNumber, officialOrigin, publicCertificate, day, internshipFields } from '../server/domain.js';

test('calendar-month duration clamps month ends and leap days',()=>{
  assert.equal(addMonths('2026-01-31',3),'2026-04-30');
  assert.equal(addMonths('2024-01-31',1),'2024-02-29');
  assert.equal(addMonths('2023-01-31',1),'2023-02-28');
  assert.equal(addMonths('2025-11-30',3),'2026-02-28');
});
test('eligibility requires duration, actual end date, approved status and explicit approval',()=>{
  const base={start_date:'2026-01-31',end_date:'2026-04-30',minimum_duration_months:3,status:'CERTIFICATE_ELIGIBLE',admin_approved:true};
  assert.equal(eligibility(base,'2026-04-29').eligible,false);
  assert.equal(eligibility(base,'2026-04-30').eligible,true);
  assert.equal(eligibility({...base,end_date:'2026-04-29'},'2026-09-28').eligible,false);
  assert.equal(eligibility({...base,end_date:'2026-10-01'},'2026-09-28').eligible,false);
  assert.equal(eligibility({...base,admin_approved:false},'2026-09-28').eligible,false);
  for(const status of ['COMPLETED','ACTIVE','REJECTED','TERMINATED','CERTIFICATE_REVOKED']) assert.equal(eligibility({...base,status},'2026-09-28').eligible,false);
});
test('date validation rejects impossible dates and unknown authority fields',()=>{
  assert.equal(day.safeParse('2026-02-30').success,false);
  assert.equal(day.safeParse('2026-02-28').success,true);
  assert.equal(internshipFields.safeParse({admin_approved:true}).success,false);
});
test('public identifiers are random, unique and nonsequential',()=>{
  const ids=new Set(Array.from({length:10000},()=>certificateNumber(new Date('2026-09-28T12:00:00Z'))));
  assert.equal(ids.size,10000);
  assert.match([...ids][0],/^NC-INT-2026-[A-F0-9]{24}$/);
});
test('official URL must be HTTPS on the existing apex domain',()=>{
  assert.equal(officialOrigin('https://nextoracreations.co.in'),'https://nextoracreations.co.in');
  for(const url of ['http://nextoracreations.co.in','https://evil.example','https://nextoracreations.co.in@evil.example','https://nextoracreations.co.in/path','https://nextoracreations.co.in?x=1']) assert.throws(()=>officialOrigin(url));
});
test('public verification is an allowlisted projection',()=>{
  const result=publicCertificate({certificate_number:'X',status:'REVOKED',issued_at:'2026-09-28',email:'private@example.test',revocation_reason:'private',snapshot:{student_name:'Test Student',role:'Intern',program:'MBA',start_date:'2026-01-01',end_date:'2026-04-01',college:'Private',project:'Internal',phone:'Private'}});
  assert.deepEqual(Object.keys(result).sort(),['status','certificate_number','student_name','role','program','start_date','end_date','issued_at','issuer'].sort());
  assert.equal(result.status,'REVOKED');
});
