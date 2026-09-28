import { z } from 'zod';
import { assert } from './domain.js';
export const placeholders=['student_name','internship_role','role','program_name','department','start_date','end_date','duration','certificate_id','offer_id','issue_date','company_name','founder_name','college','work_mode'];
const safeText=max=>z.string().trim().max(max).refine(v=>!/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v),'Use plain text only; markup is not allowed');
const templated=max=>safeText(max).superRefine((v,ctx)=>{
  for(const match of v.matchAll(/{{\s*([^{}]+)\s*}}/g)) if(!placeholders.includes(match[1].trim())) ctx.addIssue({code:'custom',message:`Unknown placeholder: ${match[1]}`});
  if(/[{}]/.test(v.replace(/{{\s*[^{}]+\s*}}/g,''))) ctx.addIssue({code:'custom',message:'Invalid placeholder syntax'});
});
export const templateSchema=z.object({
 title:templated(100),subtitle:templated(160),body:templated(1200),terms:templated(2000),footer:templated(180),
 font:z.enum(['NOTO_SANS','NOTO_SERIF']),title_size:z.number().int().min(18).max(34),body_size:z.number().int().min(10).max(14),
 logo_position:z.enum(['LEFT','RIGHT']),signature_position:z.enum(['LEFT','RIGHT']),qr_position:z.enum(['LEFT','RIGHT']),
 border:z.enum(['NONE','LINE','DOUBLE']),orientation:z.enum(['LANDSCAPE','PORTRAIT']),spacing:z.number().int().min(14).max(22),
}).strict().refine(t=>t.signature_position!==t.qr_position,'Signature and QR must occupy opposite sides');
export function defaults(kind) {
  return {title:kind==='OFFER'?'INTERNSHIP OFFER LETTER':'CERTIFICATE OF INTERNSHIP',
    subtitle:kind==='OFFER'?'Dear {{student_name}},':'This is to certify that',
    body:kind==='OFFER'?'We are pleased to offer you an internship as {{role}} under {{program_name}} in the {{department}} department at {{company_name}}, from {{start_date}} to {{end_date}}. Your work mode is {{work_mode}}.':
      'has successfully completed an internship as {{internship_role}}\nunder {{program_name}} at {{company_name}}\nfrom {{start_date}} to {{end_date}}.',
    terms:kind==='OFFER'?'Duration: {{duration}}. Working hours will be agreed with your supervisor.\nMaintain confidentiality and professional conduct. Complete assigned work and follow company policies.\nA certificate requires successful completion of the approved duration and explicit company approval.\nThe company may terminate the internship for misconduct or failure to meet agreed expectations.':'',
    footer:'Issued by {{company_name}}',font:'NOTO_SANS',title_size:kind==='OFFER'?23:30,body_size:12,
    logo_position:'LEFT',signature_position:'LEFT',qr_position:'RIGHT',border:'LINE',orientation:kind==='OFFER'?'PORTRAIT':'LANDSCAPE',spacing:18};
}
export function validateTemplate(kind,input) {
  const t=templateSchema.parse(input);
  assert(t.orientation===(kind==='OFFER'?'PORTRAIT':'LANDSCAPE'),400,'Certificates use A4 landscape; offers use A4 portrait.');
  const wrong=kind==='OFFER'?'certificate_id':'offer_id';
  assert(!Object.values(t).some(v=>typeof v==='string'&&new RegExp(`{{\\s*${wrong}\\s*}}`).test(v)),400,'A placeholder belongs to the other document type.');
  return t;
}
export function interpolate(text,values) {
  return text.replace(/{{\s*([^{}]+?)\s*}}/g,(_,key)=>String(values[key]??''));
}
