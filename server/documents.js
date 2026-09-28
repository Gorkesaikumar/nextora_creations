import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import { assert } from './domain.js';
import { defaults, interpolate } from './templates.js';
import { signatureBytes } from './pdf.js';
import { hash } from './auth.js';

export async function documentSnapshot(db,kind,config) {
  const company=(await db.query('SELECT company_name,founder_name,founder_title,website,identifiers FROM nc.company_settings WHERE id=true')).rows[0];
  const assets=(await db.query('SELECT name,png FROM nc.company_assets')).rows;
  const signature=await signatureBytes(config.signatureBase64||config.signaturePath?config:{signatureData:assets.find(a=>a.name==='authorized_signature')?.png});
  const template=(await db.query('SELECT id,published_config,published_revision FROM nc.document_templates WHERE kind=$1 AND active',[kind])).rows[0];
  const logo=assets.find(a=>a.name==='company_logo')?.png||await readFile(resolve('logo.png'));
  return {company,signature_png:signature.toString('base64'),signature_sha256:hash(signature),logo_png:logo.toString('base64'),
    document_template:template?.published_config||defaults(kind),template_id:template?.id||null,template_revision:template?.published_revision||0};
}
const format=value=>new Date(`${String(value).slice(0,10)}T00:00:00Z`).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
export async function renderDocument(document,kind,{preview=false}={}) {
  const s=document.snapshot,t=s.document_template||defaults(kind),company=s.company||{company_name:'Nextora Creations',founder_name:'Gorke Sai Kumar',founder_title:'Founder',identifiers:''};
  const number=document.certificate_number||document.offer_number;
  const values={student_name:s.student_name,internship_role:s.role,role:s.role,program_name:s.program,department:s.department,
    start_date:format(s.start_date),end_date:format(s.end_date),duration:`${s.minimum_duration_months} calendar months minimum`,
    certificate_id:number,offer_id:number,issue_date:format(document.issued_at),company_name:company.company_name,founder_name:company.founder_name,college:s.college||'',work_mode:s.work_mode||'REMOTE'};
  const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
  const family=t.font==='NOTO_SERIF'?'NotoSerif':'NotoSans';
  const [r,b]=await Promise.all(['Regular','Bold'].map(weight=>readFile(resolve(`server/assets/${family}-${weight}.ttf`))));
  const font=await doc.embedFont(r,{subset:true}),bold=await doc.embedFont(b,{subset:true});
  const [w,h]=kind==='OFFER'?[595.28,841.89]:[841.89,595.28];
  const page=doc.addPage([w,h]),ink=rgb(.067,.067,.067),muted=rgb(.34,.38,.42),cyan=rgb(0,.682,.937);
  const chars=new Set(font.getCharacterSet());
  function text(value,x,y,size=12,f=font,color=ink,max=w-96) {
    value=String(value);
    assert([...value].every(c=>chars.has(c.codePointAt(0))),422,'A document field uses unsupported characters. Select a suitable font.');
    const width=f.widthOfTextAtSize(value,size),fit=Math.min(size,size*max/Math.max(width,1));
    assert(fit>=6,422,'Document text is too long to render legibly. Shorten the content.');
    page.drawText(value,{x,y,size:fit,font:f,color});
  }
  function center(value,y,size=12,f=font) {
    const fit=Math.min(size,size*(w-100)/Math.max(f.widthOfTextAtSize(value,size),1));
    text(value,(w-f.widthOfTextAtSize(value,fit))/2,y,fit,f);
  }
  function paragraph(value,startY,width=w-100,centered=false) {
    let y=startY;
    for(const para of String(value).split('\n')) {
      let line='';
      for(const word of para.split(/\s+/)) {
        const next=line?`${line} ${word}`:word;
        if(font.widthOfTextAtSize(next,t.body_size)>width && line) {text(line,centered?(w-font.widthOfTextAtSize(line,t.body_size))/2:50,y,t.body_size,font,ink,width);y-=t.spacing;line=word;} else line=next;
      }
      if(line){text(line,centered?(w-font.widthOfTextAtSize(line,t.body_size))/2:50,y,t.body_size,font,ink,width);y-=t.spacing;}
      y-=4;
    }
    return y;
  }
  if(t.border!=='NONE') page.drawRectangle({x:24,y:24,width:w-48,height:h-48,borderColor:rgb(.86,.88,.9),borderWidth:1});
  if(t.border==='DOUBLE') page.drawRectangle({x:29,y:29,width:w-58,height:h-58,borderColor:rgb(.86,.88,.9),borderWidth:.5});
  page.drawRectangle({x:24,y:h-34,width:w-48,height:10,color:cyan});
  const logo=await doc.embedPng(s.logo_png?Buffer.from(s.logo_png,'base64'):await readFile(resolve('logo.png'))),ls=logo.scaleToFit(115,57);
  const logoX=t.logo_position==='LEFT'?50:w-165;
  page.drawImage(logo,{x:logoX,y:h-118,...ls});
  const brandX=t.logo_position==='LEFT'?210:50;
  text(company.company_name.toUpperCase(),brandX,h-80,kind==='OFFER'?14:18,bold,ink,w-260);
  text('OFFICIAL INTERNSHIP RECORD',brandX,h-99,8,font,muted,w-260);
  center(interpolate(t.title,values),h-159,t.title_size,bold);
  if(kind==='OFFER') {
    text(`Date: ${format(document.issued_at)}`,50,h-191,10);
    text(`Offer ID: ${number}`,50,h-210,9);
    let y=h-243;
    y=paragraph(interpolate(t.subtitle,values),y);
    y=paragraph(`College: ${s.college||'Not provided'}`,y-4);
    y=paragraph(interpolate(t.body,values),y-6);
    text('TERMS & EXPECTATIONS',50,y-10,10,bold); y-=30;
    y=paragraph(interpolate(t.terms,values),y);
    assert(y>=205,422,'Offer content exceeds one A4 page. Shorten the terms or reduce spacing.');
  } else {
    center(interpolate(t.subtitle,values),h-193,12);
    center(s.student_name,h-232,30,bold);
    const y=paragraph(interpolate(t.body,values),h-265,w-100,true);
    const after=t.terms?paragraph(interpolate(t.terms,values),y-4):y;
    assert(after>=205,422,'Certificate content exceeds its safe layout. Shorten the body or reduce spacing.');
  }
  const signatureX=t.signature_position==='LEFT'?50:w-210,qrX=t.qr_position==='LEFT'?50:w-150;
  if(!preview) {
    const sig=await doc.embedPng(await signatureBytes({signatureBase64:s.signature_png})),ss=sig.scaleToFit(150,42);
    page.drawImage(sig,{x:signatureX,y:147,...ss});
  } else text('Signature on issued document',signatureX,158,8,font,muted,155);
  page.drawLine({start:{x:signatureX,y:138},end:{x:signatureX+150,y:138},thickness:.6,color:muted});
  text(company.founder_name,signatureX,121,12,bold,ink,155);
  text(company.founder_title,signatureX,106,9,font,muted,155);
  text(company.company_name,signatureX,92,8,font,muted,155);
  if(!preview) {
    const qr=await doc.embedPng(await QRCode.toBuffer(document.verification_url,{width:360,margin:4,errorCorrectionLevel:'M'}));
    page.drawImage(qr,{x:qrX,y:99,width:100,height:100});
    text('SCAN TO VERIFY',qrX+12,88,8,bold,muted,100);
  } else {
    page.drawRectangle({x:qrX,y:103,width:90,height:90,borderColor:muted,borderWidth:1});
    text('QR ON ISSUE',qrX+10,143,8,font,muted,80);
    page.drawText('PREVIEW - NOT ISSUED',{x:65,y:h/2-20,size:34,font:bold,color:rgb(.88,.88,.88),rotate:degrees(25),opacity:.55});
  }
  if(kind==='CERTIFICATE') {
    text(number,275,151,9,font,ink,w-510);
    text(`Issued ${format(document.issued_at)}`,275,129,9,font,muted,w-510);
  }
  const footer=interpolate(t.footer,values);
  center(footer,70,8);
  if(company.identifiers) center(company.identifiers,57,7);
  text(preview?'PREVIEW ONLY - NO VERIFICATION RECORD':document.verification_url,50,40,kind==='OFFER'?6.5:7.3,font,muted,w-100);
  doc.setTitle(`${kind==='OFFER'?'Internship Offer':'Internship Certificate'} - ${s.student_name}`);doc.setAuthor(company.company_name);doc.setSubject(number);
  doc.setCreationDate(new Date(document.issued_at));doc.setModificationDate(new Date(document.issued_at));
  return Buffer.from(await doc.save());
}
