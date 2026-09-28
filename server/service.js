import { randomUUID } from 'node:crypto';
import { assert, eligibility, transitions, certificateNumber, publicCertificate } from './domain.js';
import { hash, token } from './auth.js';
import { generatePDF, signatureBytes } from './pdf.js';

export async function audit(db, event, actor, internshipId = null, certificateId = null, metadata = {}) {
  await db.query(`INSERT INTO nc.audit_logs(id,event,actor_id,internship_id,certificate_id,metadata)
    VALUES($1,$2,$3,$4,$5,$6)`, [randomUUID(), event, actor, internshipId, certificateId, JSON.stringify(metadata)]);
}
export const joinedInternships = `SELECT i.*, s.full_name,s.phone_number,s.college_name,s.university_name,
  s.course,s.specialization,s.registration_number,s.user_id,u.email,p.title AS program_title,
  c.certificate_number,c.status AS certificate_status,c.issued_at,
  c.snapshot->>'student_name' AS certificate_student_name,c.snapshot->>'program' AS certificate_program
  FROM nc.internships i JOIN nc.students s ON s.id=i.student_id JOIN nc.users u ON u.id=s.user_id
  JOIN nc.programs p ON p.id=i.program_id LEFT JOIN nc.certificates c ON c.internship_id=i.id`;

export class InternshipService {
  constructor(db, config, clock = () => new Date()) { this.db = db; this.config = config; this.clock = clock; }
  today() { return this.clock().toISOString().slice(0,10); }
  async record(db, id, actor, lock = false) {
    const { rows } = await db.query(`${joinedInternships} WHERE i.id=$1${lock ? ' FOR UPDATE OF i,s' : ''}`, [id]);
    const record = rows[0];
    assert(record && (actor.role === 'ADMIN' || record.user_id === actor.id), 404,
      'We could not find an eligible internship record for these details. Please contact Nextora Creations.');
    return record;
  }
  async invitation(db, userId) {
    const raw = token();
    await db.query('UPDATE nc.invitations SET used_at=now() WHERE user_id=$1 AND used_at IS NULL', [userId]);
    await db.query(`INSERT INTO nc.invitations(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '48 hours')`, [hash(raw), userId]);
    // Fragment is never sent to HTTP logs or referrers. Deliver privately; do not audit it.
    return `${this.config.appOrigin}/internship/certificate#invite=${raw}`;
  }
  async createInternship(actor, input) {
    return this.db.transaction(async db => {
      const p = (await db.query("SELECT * FROM nc.programs WHERE id=$1 AND status='ACTIVE' FOR SHARE", [input.internship.program_id])).rows[0];
      assert(p, 400, 'Select an active internship program.');
      const existing = (await db.query('SELECT * FROM nc.users WHERE email=$1', [input.student.email])).rows[0];
      assert(!existing || existing.role === 'STUDENT', 409, 'This email belongs to a company account.');
      let userId = existing?.id, studentId, invitation_url = null;
      if (!existing) {
        userId = randomUUID(); studentId = randomUUID();
        await db.query("INSERT INTO nc.users(id,email,role) VALUES($1,$2,'STUDENT')", [userId, input.student.email]);
        const s = input.student;
        await db.query(`INSERT INTO nc.students(id,user_id,full_name,phone_number,college_name,university_name,course,specialization,registration_number)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [studentId,userId,s.full_name,s.phone_number,s.college_name,s.university_name,s.course,s.specialization,s.registration_number]);
        invitation_url = await this.invitation(db, userId);
      } else {
        studentId = (await db.query('SELECT id FROM nc.students WHERE user_id=$1 FOR UPDATE', [userId])).rows[0]?.id;
        assert(studentId && !existing.disabled, 409, 'Student account is unavailable.');
      }
      const id = randomUUID(), i = input.internship;
      await db.query(`INSERT INTO nc.internships(id,student_id,program_id,role,department,start_date,end_date,minimum_duration_months,mentor,project,status)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [id,studentId,i.program_id,i.role,i.department,i.start_date,i.end_date,p.minimum_duration_months,i.mentor,i.project,existing?.password_hash ? 'REGISTERED' : 'INVITED']);
      await audit(db, 'INTERNSHIP_CREATED', actor.id, id);
      return { internship: await this.record(db, id, actor), invitation_url };
    });
  }
  async editInternship(actor, id, input) {
    return this.db.transaction(async db => {
      const i = await this.record(db, id, actor, true);
      assert(!i.certificate_number, 409, 'Issued internship records are locked. Revoke an incorrect certificate; preserve its history.');
      const p = (await db.query('SELECT * FROM nc.programs WHERE id=$1 FOR SHARE', [input.program_id])).rows[0];
      assert(p && (p.status === 'ACTIVE' || p.id === i.program_id), 400, 'Select an active program.');
      await db.query(`UPDATE nc.internships SET program_id=$2,role=$3,department=$4,start_date=$5,end_date=$6,
        mentor=$7,project=$8,minimum_duration_months=$9,admin_approved=false,approved_by=NULL,approved_at=NULL,
        status=CASE WHEN status='CERTIFICATE_ELIGIBLE' THEN 'COMPLETED' ELSE status END,updated_at=now() WHERE id=$1`,
      [id,input.program_id,input.role,input.department,input.start_date,input.end_date,input.mentor,input.project,
        input.program_id === i.program_id ? i.minimum_duration_months : p.minimum_duration_months]);
      await audit(db, 'INTERNSHIP_UPDATED', actor.id, id, null, { approval_reset: true });
      return this.record(db, id, actor);
    });
  }
  async transition(actor, id, status) {
    return this.db.transaction(async db => {
      const i = await this.record(db, id, actor, true);
      assert(transitions[i.status].includes(status), 409, 'This status transition is not allowed.');
      const check = eligibility(i, this.today());
      if (status === 'COMPLETED' || status === 'CERTIFICATE_ELIGIBLE') {
        assert(check.duration_met, 409, 'The approved internship period and required duration must be completed first.', 'DURATION_NOT_MET');
      }
      const approved = status === 'CERTIFICATE_ELIGIBLE';
      await db.query(`UPDATE nc.internships SET status=$2,admin_approved=$3,approved_by=$4,approved_at=$5,updated_at=now() WHERE id=$1`,
        [id,status,approved,approved ? actor.id : null,approved ? this.clock() : null]);
      await audit(db, approved ? 'CERTIFICATE_APPROVED' : status === 'COMPLETED' ? 'INTERNSHIP_COMPLETED' : 'INTERNSHIP_STATUS_CHANGED', actor.id, id, null, { from: i.status, to: status });
      return this.record(db, id, actor);
    });
  }
  async confirmDetails(actor, id, profile) {
    return this.db.transaction(async db => {
      const i = await this.record(db, id, actor, true);
      assert(actor.id === i.user_id, 403, 'Only the student may confirm their details.');
      const approved = (await db.query("SELECT id FROM nc.internships WHERE student_id=$1 AND status='CERTIFICATE_ELIGIBLE'", [i.student_id])).rows;
      assert(!approved.length, 409, 'Your details are approved for issuance. Contact Nextora Creations for a correction.');
      await db.query(`UPDATE nc.students SET full_name=$2,phone_number=$3,college_name=$4,university_name=$5,course=$6,specialization=$7,registration_number=$8,updated_at=now() WHERE id=$1`,
        [i.student_id,profile.full_name,profile.phone_number,profile.college_name,profile.university_name,profile.course,profile.specialization,profile.registration_number]);
      await db.query('UPDATE nc.internships SET details_confirmed_at=now(),updated_at=now() WHERE id=$1', [id]);
      await audit(db, 'STUDENT_DETAILS_CONFIRMED', actor.id, id);
      return this.record(db, id, actor);
    });
  }
  async issue(actor, id) {
    return this.db.transaction(async db => {
      const i = await this.record(db, id, actor, true);
      const previous = (await db.query('SELECT * FROM nc.certificates WHERE internship_id=$1', [id])).rows[0];
      if (previous) {
        assert(previous.status === 'VALID', 409, 'This certificate has been revoked.');
        return publicCertificate(previous);
      }
      assert(eligibility(i, this.today()).eligible, 403,
        'Your internship certificate will become available after successful completion of your internship and company approval.', 'NOT_ELIGIBLE');
      // Lock program while reading its title, so updates and issuance are consistent.
      const p = (await db.query('SELECT * FROM nc.programs WHERE id=$1 FOR SHARE', [i.program_id])).rows[0];
      const signature = await signatureBytes(this.config.signatureBase64 || this.config.signaturePath ? this.config : {
        signatureData: (await db.query("SELECT png FROM nc.company_assets WHERE name='authorized_signature'")).rows[0]?.png,
      });
      const now = this.clock(), number = certificateNumber(now);
      const certificate = { id: randomUUID(), certificate_number: number, issued_at: now.toISOString(),
        verification_url: `${this.config.officialOrigin}/verify-certificate/${number}`, status: 'VALID',
        snapshot: { student_name: i.full_name, role: i.role, department: i.department, program: p.title,
          start_date: i.start_date, end_date: i.end_date, minimum_duration_months: i.minimum_duration_months,
          college: i.college_name, project: i.project, template: p.certificate_template,
          signature_png: signature.toString('base64'), signature_sha256: hash(signature) } };
      const pdf = await generatePDF(certificate, this.config);
      await db.query(`INSERT INTO nc.certificates(id,certificate_number,internship_id,student_id,snapshot,verification_url,issued_at,issued_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [certificate.id,number,id,i.student_id,JSON.stringify(certificate.snapshot),certificate.verification_url,now,actor.id]);
      await db.query('INSERT INTO nc.certificate_pdfs(id,certificate_id,revision,pdf,sha256,created_by) VALUES($1,$2,1,$3,$4,$5)',
        [randomUUID(),certificate.id,pdf,hash(pdf),actor.id]);
      await db.query("UPDATE nc.internships SET status='CERTIFICATE_ISSUED',updated_at=now() WHERE id=$1", [id]);
      await audit(db, 'CERTIFICATE_GENERATED', actor.id, id, certificate.id, { revision: 1, sha256: hash(pdf) });
      return publicCertificate(certificate);
    });
  }
  async revoke(actor, id, reason) {
    return this.db.transaction(async db => {
      await this.record(db, id, actor, true);
      const c = (await db.query('SELECT * FROM nc.certificates WHERE internship_id=$1 FOR UPDATE', [id])).rows[0];
      assert(c, 404, 'No issued certificate was found.');
      if (c.status === 'REVOKED') return publicCertificate(c);
      await db.query("UPDATE nc.certificates SET status='REVOKED',revoked_at=now(),revoked_by=$2,revocation_reason=$3 WHERE id=$1", [c.id,actor.id,reason]);
      await db.query("UPDATE nc.internships SET status='CERTIFICATE_REVOKED',updated_at=now() WHERE id=$1", [id]);
      await audit(db, 'CERTIFICATE_REVOKED', actor.id, id, c.id, { reason });
      return publicCertificate({ ...c, status: 'REVOKED' });
    });
  }
  async regenerate(actor, id) {
    return this.db.transaction(async db => {
      await this.record(db, id, actor, true);
      const c = (await db.query("SELECT * FROM nc.certificates WHERE internship_id=$1 AND status='VALID' FOR UPDATE", [id])).rows[0];
      assert(c, 409, 'Only a valid issued certificate can be regenerated.');
      const pdf = await generatePDF(c, this.config);
      const revision = Number((await db.query('SELECT max(revision) AS revision FROM nc.certificate_pdfs WHERE certificate_id=$1', [c.id])).rows[0].revision) + 1;
      await db.query('INSERT INTO nc.certificate_pdfs(id,certificate_id,revision,pdf,sha256,created_by) VALUES($1,$2,$3,$4,$5,$6)',
        [randomUUID(),c.id,revision,pdf,hash(pdf),actor.id]);
      await audit(db, 'CERTIFICATE_REGENERATED', actor.id, id, c.id, { revision, sha256: hash(pdf) });
      return { ...publicCertificate(c), revision };
    });
  }
  async pdf(actor, id) {
    return this.db.transaction(async db => {
      await this.record(db, id, actor, true);
      const c = (await db.query('SELECT * FROM nc.certificates WHERE internship_id=$1', [id])).rows[0];
      assert(c, 404, 'No issued certificate was found.');
      assert(c.status === 'VALID', 409, 'This certificate has been revoked.');
      const file = (await db.query('SELECT pdf,sha256 FROM nc.certificate_pdfs WHERE certificate_id=$1 ORDER BY revision DESC LIMIT 1', [c.id])).rows[0];
      assert(file && hash(file.pdf) === file.sha256, 503, 'The certificate document is unavailable. Please contact Nextora Creations.');
      await audit(db, 'CERTIFICATE_DOWNLOADED', actor.id, id, c.id);
      const name = c.snapshot.student_name.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').slice(0,70) || 'Student';
      return { bytes: file.pdf, filename: `Nextora-Creations-Internship-Certificate-${name}-${c.certificate_number}.pdf` };
    });
  }
}
