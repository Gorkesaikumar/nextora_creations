import { randomBytes } from 'node:crypto';
import { z } from 'zod';

export class HttpError extends Error {
  constructor(status, message, code = 'REQUEST_FAILED') { super(message); this.status = status; this.code = code; }
}
export const assert = (condition, status, message, code) => {
  if (!condition) throw new HttpError(status, message, code);
};
export const uuid = z.string().uuid();
const clean = (max = 160) => z.string().trim().max(max).refine(v => !/[\u0000-\u001f\u007f]/u.test(v), 'Control characters are not allowed');
const required = (max = 160) => clean(max).refine(v => v.length > 0, 'Required');
export const email = z.string().trim().toLowerCase().email().max(254);
export const password = z.string().min(12).max(128);
export const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v && v >= '2000-01-01' && v < '2100-01-01';
}, 'Invalid date');
export const profileSchema = z.object({
  full_name: required(100), phone_number: clean(32), college_name: clean(), university_name: clean(),
  course: clean(100), specialization: clean(100), registration_number: clean(100),
}).strict();
export const programSchema = z.object({
  title: required(120), description: clean(2000), department: required(100),
  duration_months: z.number().int().min(1).max(60),
  minimum_duration_months: z.number().int().min(1).max(60),
  start_date: day.nullable(), end_date: day.nullable(),
  status: z.enum(['DRAFT','ACTIVE','ARCHIVED']), certificate_template: z.literal('nextora-v1'),
}).strict().refine(p => p.duration_months >= p.minimum_duration_months, 'Duration must meet the minimum')
  .refine(p => !p.start_date || !p.end_date || p.end_date >= p.start_date, 'End date must follow start date');
export const internshipFields = z.object({ program_id: uuid, role: required(120), department: required(100),
  start_date: day, end_date: day, mentor: clean(120), project: clean(400),
}).strict().refine(i => i.end_date >= i.start_date, 'End date must follow start date');
export const createInternshipSchema = z.object({ student: profileSchema.extend({ email }), internship: internshipFields }).strict();
export const states = ['INVITED','REGISTERED','ACTIVE','COMPLETED','CERTIFICATE_ELIGIBLE','CERTIFICATE_ISSUED','REJECTED','TERMINATED','CERTIFICATE_REVOKED'];
export const transitions = {
  INVITED: ['REGISTERED','ACTIVE','REJECTED'], REGISTERED: ['ACTIVE','REJECTED'],
  ACTIVE: ['COMPLETED','TERMINATED'], COMPLETED: ['CERTIFICATE_ELIGIBLE','REJECTED'],
  CERTIFICATE_ELIGIBLE: ['COMPLETED','REJECTED'], REJECTED: ['ACTIVE'], TERMINATED: [],
  CERTIFICATE_ISSUED: [], CERTIFICATE_REVOKED: [],
};
export function addMonths(date, months) {
  const d = new Date(`${date}T00:00:00Z`);
  const dayOfMonth = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dayOfMonth, lastDay));
  return d.toISOString().slice(0, 10);
}
export function eligibility(record, today) {
  const eligible_date = addMonths(record.start_date, record.minimum_duration_months);
  const duration_met = record.end_date >= eligible_date && today >= eligible_date && today >= record.end_date;
  return { eligible_date, duration_met,
    eligible: duration_met && record.status === 'CERTIFICATE_ELIGIBLE' && record.admin_approved === true };
}
export function certificateNumber(now) {
  return `NC-INT-${now.getUTCFullYear()}-${randomBytes(12).toString('hex').toUpperCase()}`;
}
export const certificatePattern = /^NC-INT-\d{4}-[A-F0-9]{24}$/;
export function officialOrigin(value) {
  const url = new URL(value);
  assert(url.protocol === 'https:' && url.hostname === 'nextoracreations.co.in' && !url.port && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash,
    503, 'Official certificate domain is not configured correctly.');
  return url.origin;
}
export function publicCertificate(c) {
  return { status: c.status === 'REVOKED' ? 'REVOKED' : 'VERIFIED', certificate_number: c.certificate_number,
    student_name: c.snapshot.student_name, role: c.snapshot.role, program: c.snapshot.program,
    start_date: c.snapshot.start_date, end_date: c.snapshot.end_date, issued_at: c.issued_at,
    issuer: 'Nextora Creations' };
}
