import { PDFDocument } from 'pdf-lib';
import { getDatabase } from '../server/db.js';
import { signatureBytes } from '../server/pdf.js';
import { email, assert } from '../server/domain.js';
import { hash } from '../server/auth.js';
import { audit } from '../server/service.js';
const actorEmail=email.parse(process.env.ADMIN_EMAIL);
const bytes=await signatureBytes({signaturePath:process.env.CERTIFICATE_SIGNATURE_PATH});
// Decode before persisting, so malformed PNGs cannot disable later issuance.
const probe=await PDFDocument.create(); await probe.embedPng(bytes);
const db=getDatabase();
try {
  await db.transaction(async tx=>{
    const user=(await tx.query("SELECT id FROM nc.users WHERE email=$1 AND role='ADMIN' AND NOT disabled",[actorEmail])).rows[0];
    assert(user,403,'ADMIN_EMAIL must identify an active company administrator.');
    await tx.query(`INSERT INTO nc.company_assets(name,png,sha256,updated_by) VALUES('authorized_signature',$1,$2,$3)
      ON CONFLICT(name) DO UPDATE SET png=EXCLUDED.png,sha256=EXCLUDED.sha256,updated_by=EXCLUDED.updated_by,updated_at=now()`,[bytes,hash(bytes),user.id]);
    await audit(tx,'SIGNATURE_CONFIGURED',user.id,null,null,{sha256:hash(bytes)});
  });
  console.log('Authorized signature provisioned privately. Future certificates use it; issued snapshots retain their original signature.');
} finally {await db.close();}
