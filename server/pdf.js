import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import { assert } from './domain.js';
import { renderDocument } from './documents.js';

const asset = name => readFile(resolve(process.cwd(), 'server/assets', name));
let fonts;
async function fontBytes() {
  fonts ||= Promise.all([asset('NotoSans-Regular.ttf'), asset('NotoSans-Bold.ttf')]);
  return fonts;
}
export async function signatureBytes(config) {
  const bytes = config.signatureData || (config.signatureBase64 ? Buffer.from(config.signatureBase64, 'base64')
    : config.signaturePath ? await readFile(resolve(config.signaturePath)) : null);
  assert(bytes, 503, 'Certificate issuance is awaiting the authorized company signature.', 'SIGNATURE_REQUIRED');
  assert(bytes.length >= 24 && bytes.length <= 512000 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    503, 'The configured signature must be a PNG of at most 500 KB.');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  assert(width >= 20 && height >= 10 && width <= 2000 && height <= 1000,
    503, 'The configured signature dimensions are invalid.');
  return bytes;
}
export async function generatePDF(certificate, config) {
  if(certificate.snapshot.document_template) return renderDocument(certificate,'CERTIFICATE');
  const signature = await signatureBytes(certificate.snapshot.signature_png
    ? { signatureBase64: certificate.snapshot.signature_png } : config);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await fontBytes();
  const regular = await doc.embedFont(regularBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });
  const supported = new Set(regular.getCharacterSet());
  const s = certificate.snapshot;
  for (const value of [s.student_name, s.role, s.program, s.department]) {
    assert([...value].every(c => supported.has(c.codePointAt(0))), 422,
      'A certificate field uses characters unavailable in the certificate font. Ask the administrator to configure a suitable font.');
  }
  const page = doc.addPage([841.89, 595.28]);
  const ink = rgb(0.067,0.067,0.067), muted = rgb(0.34,0.38,0.42), cyan = rgb(0,0.682,0.937);
  const text = (value, x, y, size = 12, font = regular, color = ink) => page.drawText(value, { x, y, size, font, color });
  const center = (value, y, size, font = regular, maxWidth = 704, color = ink) => {
    const width = font.widthOfTextAtSize(value, size);
    const fit = Math.min(size, size * maxWidth / Math.max(width, 1));
    assert(fit >= 9, 422, 'Certificate text is too long to print legibly. Please shorten the role or program.');
    text(value, (841.89 - font.widthOfTextAtSize(value, fit)) / 2, y, fit, font, color);
  };
  page.drawRectangle({ x: 24, y: 24, width: 793.89, height: 547.28, borderColor: rgb(0.87,0.88,0.89), borderWidth: 1 });
  page.drawRectangle({ x: 24, y: 561, width: 793.89, height: 10, color: cyan });
  const logo = await doc.embedPng(await readFile(resolve(process.cwd(), 'logo.png')));
  const logoSize = logo.scaleToFit(142, 68);
  page.drawImage(logo, { x: 58, y: 472, ...logoSize });
  text('NEXTORA CREATIONS', 531, 516, 16, bold);
  text('WE BUILD SYSTEMS FOR YOUR BUSINESS', 531, 499, 7.5, regular, muted);
  center('CERTIFICATE OF INTERNSHIP', 428, 30, bold);
  center('This is to certify that', 390, 12, regular, 704, muted);
  center(s.student_name, 347, 32, bold);
  page.drawLine({ start: { x: 270, y: 330 }, end: { x: 572, y: 330 }, thickness: 2, color: cyan });
  center('has successfully completed an internship as', 302, 12, regular, 704, muted);
  center(s.role, 275, 19, bold);
  const format = value => new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  center(`at Nextora Creations from ${format(s.start_date)} to ${format(s.end_date)}.`, 250, 12);
  center(`${s.program}  |  ${s.department}`, 225, 11, regular, 704, muted);
  const sig = await doc.embedPng(signature), sigSize = sig.scaleToFit(150, 48);
  page.drawImage(sig, { x: 67, y: 143, ...sigSize });
  page.drawLine({ start: { x: 64, y: 138 }, end: { x: 225, y: 138 }, thickness: 0.7, color: muted });
  text('Authorized Signature', 64, 124, 8, regular, muted);
  text('Gorke Sai Kumar', 64, 108, 12, bold);
  text('Founder, Nextora Creations', 64, 92, 9, regular, muted);
  const qr = await doc.embedPng(await QRCode.toBuffer(certificate.verification_url, { type: 'png', width: 360, margin: 4, errorCorrectionLevel: 'M' }));
  page.drawImage(qr, { x: 668, y: 98, width: 100, height: 100 });
  text('SCAN TO VERIFY', 680, 85, 8, bold, muted);
  text('CERTIFICATE ID', 287, 157, 8, bold, muted);
  text(certificate.certificate_number, 287, 140, 9, regular);
  text(`ISSUED ${format(new Date(certificate.issued_at).toISOString().slice(0,10))}`, 287, 112, 8, regular, muted);
  text('Issued by Nextora Creations', 287, 95, 9, regular, muted);
  text(certificate.verification_url, 64, 53, 7.3, regular, muted);
  doc.setTitle(`Internship Certificate - ${s.student_name}`);
  doc.setAuthor('Nextora Creations');
  doc.setSubject(certificate.certificate_number);
  doc.setCreationDate(new Date(certificate.issued_at));
  doc.setModificationDate(new Date(certificate.issued_at));
  return Buffer.from(await doc.save());
}
