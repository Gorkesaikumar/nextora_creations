import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { assert, uuid, email, day, profileSchema, internshipFields, createInternshipSchema, programSchema, states, eligibility } from './domain.js';
import { audit, joinedInternships, publicOffer } from './service.js';
import { hash, rateLimit } from './auth.js';
import { defaults, validateTemplate, placeholders } from './templates.js';
import { signatureBytes } from './pdf.js';
import { renderDocument } from './documents.js';

const plain = max => z.string().trim().max(max).refine(v=>!/[<>\u0000-\u001f]/.test(v),'Use plain text');
const kindSchema=z.enum(['CERTIFICATE','OFFER']);
const publicColumns='id,slug,title,description,department,role,responsibilities,skills,eligibility,duration_months,minimum_duration_months,start_date,end_date,application_deadline,internship_type,location,work_mode,positions,status,applications_enabled';
const pdfResponse=(bytes,filename='Nextora-Template-Preview.pdf',view=false)=>new Response(bytes,{headers:{'Content-Type':'application/pdf','Cache-Control':'no-store, private','Vary':'Cookie','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Disposition':`${view?'inline':'attachment'}; filename="${filename}"`}});

export async function saveProgram(db,actor,input,id=null) {
  const p=programSchema.parse(input),creating=!id; id ||= randomUUID();
  await db.transaction(async tx=>{
    const previous=creating?null:(await tx.query('SELECT * FROM nc.programs WHERE id=$1 FOR UPDATE',[id])).rows[0];
    assert(creating||previous,404,'Program not found.');
    p.slug ||= previous?.slug || `${p.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,95)||'program'}-${id}`;
    const keys=Object.keys(p),values=[id,...keys.map(k=>p[k])];
    if(creating) await tx.query(`INSERT INTO nc.programs(id,${keys.join(',')}) VALUES(${values.map((_,i)=>`$${i+1}`).join(',')})`,values);
    else await tx.query(`UPDATE nc.programs SET ${keys.map((k,i)=>`${k}=$${i+2}`).join(',')},updated_at=now() WHERE id=$1`,values);
    await audit(tx,creating?'PROGRAM_CREATED':'PROGRAM_UPDATED',actor.id,null,null,{program_id:id});
    if(p.status==='PUBLISHED'&&previous?.status!=='PUBLISHED') await audit(tx,'PROGRAM_PUBLISHED',actor.id,null,null,{program_id:id});
  });
  return {id};
}

export async function publicExtension(c) {
  const {db,path,method,url,request,body,json,config,ip,service}=c;
  if(path==='/api/programs'&&method==='GET') return json({programs:(await db.query(`SELECT ${publicColumns} FROM nc.programs WHERE status IN ('ACTIVE','PUBLISHED') ORDER BY title LIMIT 200`)).rows});
  const program=path.match(/^\/api\/programs\/([a-z0-9-]+)(\/applications)?$/);
  if(program) {
    const p=(await db.query(`SELECT ${publicColumns} FROM nc.programs WHERE slug=$1 AND status IN ('ACTIVE','PUBLISHED','CLOSED')`,[program[1]])).rows[0];
    assert(p,404,'Program not found.');
    if(!program[2]&&method==='GET') return json({program:p});
    if(program[2]&&method==='POST') {
      await rateLimit(db,`apply:${ip}`,5,3600,config.rateSecret);
      const input=await body(request,z.object({student:profileSchema.extend({email}),motivation:z.string().trim().max(1500).refine(v=>!/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v),'Use plain text')}).strict());
      await db.transaction(async tx=>{
        const live=(await tx.query('SELECT * FROM nc.programs WHERE id=$1 FOR SHARE',[p.id])).rows[0];
        assert(['ACTIVE','PUBLISHED'].includes(live.status)&&live.applications_enabled&&(!live.application_deadline||live.application_deadline>=service.today()),409,'Applications are closed for this program.');
        const {email:address,...profile}=input.student;
        const result=await tx.query(`INSERT INTO nc.applications(id,program_id,email,profile,motivation) VALUES($1,$2,$3,$4,$5) ON CONFLICT(program_id,email) DO NOTHING RETURNING id`,[randomUUID(),p.id,address,JSON.stringify(profile),input.motivation]);
        if(result.rows.length) await audit(tx,'APPLICATION_SUBMITTED',null,null,null,{application_id:result.rows[0].id,program_id:p.id});
      });
      return json({success:true,message:'Your application has been received. Nextora will contact you after review.'},202);
    }
  }
  if(path.startsWith('/api/verify-offer/')&&method==='GET') {
    await rateLimit(db,`verify-offer:${ip}`,30,60,config.rateSecret);
    const number=path.slice('/api/verify-offer/'.length).toUpperCase();
    const o=/^NC-OFFER-\d{4}-[A-F0-9]{24}$/.test(number)?(await db.query('SELECT offer_number,snapshot,status,issued_at FROM nc.offer_letters WHERE offer_number=$1',[number])).rows[0]:null;
    return o?json(publicOffer(o)):json({status:'NOT_FOUND',message:'This offer letter could not be verified.'},404);
  }
  return null;
}

async function preview(db,kind,config) {
  const company=(await db.query('SELECT company_name,founder_name,founder_title,website,identifiers FROM nc.company_settings WHERE id=true')).rows[0];
  const logo=(await db.query("SELECT png FROM nc.company_assets WHERE name='company_logo'")).rows[0]?.png;
  return renderDocument({certificate_number:kind==='CERTIFICATE'?'PREVIEW-CERTIFICATE':undefined,offer_number:kind==='OFFER'?'PREVIEW-OFFER':undefined,
    issued_at:new Date().toISOString(),snapshot:{student_name:'Alex Morgan',role:'Marketing Intern',program:'MBA Marketing Internship',department:'Marketing',college:'Example University',work_mode:'REMOTE',start_date:'2026-01-01',end_date:'2026-04-01',minimum_duration_months:3,company,logo_png:logo?.toString('base64'),document_template:config}},kind,{preview:true});
}

export async function privateExtension(c) {
  const {db,path,method,url,request,body,json,actor,service}=c;
  const offer=path.match(/^\/api\/(admin|me)\/internships\/([^/]+)\/(offer|offer-pdf|offer-revoke)$/);
  if(offer) {
    const id=uuid.parse(offer[2]);
    if(offer[3]==='offer-pdf'&&method==='GET') {const p=await service.offerPDF(actor,id);return pdfResponse(p.bytes,p.filename,url.searchParams.get('view')==='1');}
    if(offer[1]==='admin'&&offer[3]==='offer'&&method==='POST') {await body(request,z.object({}).strict());return json(await service.issueOffer(actor,id));}
    if(offer[1]==='admin'&&offer[3]==='offer-revoke'&&method==='POST') {
      const {reason}=await body(request,z.object({reason:plain(500).min(5)}).strict());
      return json(await db.transaction(async tx=>{
        await service.record(tx,id,actor,true);
        const o=(await tx.query('SELECT * FROM nc.offer_letters WHERE internship_id=$1 FOR UPDATE',[id])).rows[0];assert(o,404,'Offer not found.');
        if(o.status!=='REVOKED') {await tx.query("UPDATE nc.offer_letters SET status='REVOKED',revoked_at=now(),revoked_by=$2,revocation_reason=$3 WHERE id=$1",[o.id,actor.id,reason]);await audit(tx,'OFFER_LETTER_REVOKED',actor.id,id,null,{offer_id:o.id,reason});}
        return publicOffer({...o,status:'REVOKED'});
      }));
    }
  }
  if(!path.startsWith('/api/admin/')) return null;
  assert(actor.role==='ADMIN',403,'Company administrator access is required.');
  const page=z.coerce.number().int().min(1).max(100000).parse(url.searchParams.get('page')||1),offset=(page-1)*25;
  if(path==='/api/admin/dashboard'&&method==='GET') {
    const counts=(await db.query(`SELECT count(DISTINCT student_id)::int total,count(*) FILTER(WHERE status='ACTIVE')::int active,
      count(*) FILTER(WHERE status IN ('COMPLETED','CERTIFICATE_ELIGIBLE','CERTIFICATE_ISSUED','CERTIFICATE_REVOKED'))::int completed,
      count(*) FILTER(WHERE status='CERTIFICATE_ELIGIBLE')::int eligible,(SELECT count(*)::int FROM nc.certificates) issued,
      (SELECT count(*)::int FROM nc.offer_letters) offers,(SELECT count(*)::int FROM nc.certificates WHERE status='REVOKED') revoked,
      (SELECT count(*)::int FROM nc.programs WHERE status IN ('ACTIVE','PUBLISHED')) programs FROM nc.internships`)).rows[0];
    const recent=(await db.query(`${joinedInternships} ORDER BY i.created_at DESC LIMIT 6`)).rows;
    const upcoming=(await db.query(`${joinedInternships} WHERE i.status='ACTIVE' AND i.end_date BETWEEN $1::date AND $1::date+30 ORDER BY i.end_date LIMIT 10`,[service.today()])).rows;
    const documents=(await db.query(`SELECT certificate_number AS number,'CERTIFICATE' AS kind,snapshot->>'student_name' AS student_name,internship_id,issued_at FROM nc.certificates UNION ALL SELECT offer_number,'OFFER',snapshot->>'student_name',internship_id,issued_at FROM nc.offer_letters ORDER BY issued_at DESC LIMIT 10`)).rows;
    return json({counts,recent,upcoming,documents});
  }
  if(path==='/api/admin/interns'&&method==='POST') {const input=await body(request,createInternshipSchema);return json(await service.createInternship(actor,{...input,workflow_version:2}),201);}
  if(path==='/api/admin/interns'&&method==='GET') {
    const search=plain(100).parse(url.searchParams.get('search')||'');
    const filters={status:z.enum(['',...states]).parse(url.searchParams.get('status')||''),program_id:z.union([z.literal(''),uuid]).parse(url.searchParams.get('program_id')||''),certificate_status:z.enum(['','VALID','REVOKED','NONE']).parse(url.searchParams.get('certificate_status')||''),offer_status:z.enum(['','VALID','REVOKED','NONE']).parse(url.searchParams.get('offer_status')||''),start_date:z.union([z.literal(''),day]).parse(url.searchParams.get('start_date')||''),end_date:z.union([z.literal(''),day]).parse(url.searchParams.get('end_date')||'')};
    const values=[`%${search.replace(/[\\%_]/g,'\\$&')}%`];
    const where=['(s.full_name ILIKE $1 OR u.email ILIKE $1 OR i.id::text ILIKE $1 OR s.college_name ILIKE $1)'];
    const columns={status:'i.status',program_id:'i.program_id::text',certificate_status:"coalesce(c.status,'NONE')",offer_status:"coalesce(o.status,'NONE')",start_date:'i.start_date::text',end_date:'i.end_date::text'};
    for(const [key,value] of Object.entries(filters)) if(value){values.push(value);where.push(`${columns[key]}=$${values.length}`);}
    const query=`${joinedInternships} WHERE ${where.join(' AND ')}`;
    const total=(await db.query(`SELECT count(*)::int total FROM (${query}) records`,values)).rows[0].total;
    const rows=(await db.query(`${query} ORDER BY i.created_at DESC LIMIT 25 OFFSET $${values.length+1}`,[...values,offset])).rows;
    return json({internships:rows.map(i=>({...i,...eligibility(i,service.today())})),total,page});
  }
  if(path==='/api/admin/applications'&&method==='GET') return json({applications:(await db.query(`SELECT a.*,p.title AS program_title FROM nc.applications a JOIN nc.programs p ON p.id=a.program_id ORDER BY a.created_at DESC LIMIT 25 OFFSET $1`,[offset])).rows,page});
  const application=path.match(/^\/api\/admin\/applications\/([^/]+)$/);
  if(application&&method==='PATCH') {
    const id=uuid.parse(application[1]),input=await body(request,z.object({status:z.enum(['UNDER_REVIEW','REJECTED','ACCEPTED']),internship:internshipFields.optional()}).strict());
    return json(await db.transaction(async tx=>{
      const a=(await tx.query('SELECT * FROM nc.applications WHERE id=$1 FOR UPDATE',[id])).rows[0];assert(a,404,'Application not found.');assert(a.status!=='ACCEPTED',409,'This application already has an internship.');
      let result={};
      if(input.status==='ACCEPTED') {assert(input.internship?.program_id===a.program_id,400,'Confirm the authoritative internship dates and program.');result=await service.createInternship(actor,{student:{...a.profile,email:a.email},internship:input.internship,workflow_version:2},tx);}
      await tx.query('UPDATE nc.applications SET status=$2,internship_id=$3,reviewed_by=$4,updated_at=now() WHERE id=$1',[id,input.status,result.internship?.id||null,actor.id]);
      await audit(tx,'APPLICATION_REVIEWED',actor.id,result.internship?.id||null,null,{application_id:id,status:input.status});return {success:true,...result};
    }));
  }
  if(['/api/admin/offers','/api/admin/certificates'].includes(path)&&method==='GET') {
    const offerList=path.endsWith('/offers'),table=offerList?'offer_letters':'certificates',column=offerList?'offer_number':'certificate_number';
    return json({documents:(await db.query(`SELECT ${column} AS number,internship_id,status,issued_at,snapshot->>'student_name' AS student_name,snapshot->>'program' AS program FROM nc.${table} ORDER BY issued_at DESC LIMIT 25 OFFSET $1`,[offset])).rows,page});
  }
  if(path==='/api/admin/audit-logs'&&method==='GET') {const search=plain(100).parse(url.searchParams.get('search')||'');return json({logs:(await db.query(`SELECT a.id,a.event,a.actor_id,u.email AS actor_email,a.internship_id,a.certificate_id,a.metadata,a.created_at FROM nc.audit_logs a LEFT JOIN nc.users u ON u.id=a.actor_id WHERE a.event ILIKE $1 ORDER BY a.created_at DESC,a.id DESC LIMIT 25 OFFSET $2`,[`%${search.replace(/[\\%_]/g,'\\$&')}%`,offset])).rows,page});}
  if(path==='/api/admin/templates'&&method==='GET') return json({templates:(await db.query('SELECT * FROM nc.document_templates ORDER BY kind,created_at')).rows,defaults:{CERTIFICATE:defaults('CERTIFICATE'),OFFER:defaults('OFFER')},placeholders});
  if(path==='/api/admin/templates/preview'&&method==='POST') {const p=await body(request,z.object({kind:kindSchema,config:z.unknown()}).strict());return pdfResponse(await preview(db,p.kind,validateTemplate(p.kind,p.config)),undefined,true);}
  if(path==='/api/admin/templates'&&method==='POST') {
    const input=await body(request,z.object({name:plain(100).min(1),kind:kindSchema,config:z.unknown().optional()}).strict()),id=randomUUID();
    const config=validateTemplate(input.kind,input.config||defaults(input.kind));
    await db.transaction(async tx=>{await tx.query('INSERT INTO nc.document_templates(id,kind,name,draft,updated_by) VALUES($1,$2,$3,$4,$5)',[id,input.kind,input.name,JSON.stringify(config),actor.id]);await audit(tx,'TEMPLATE_CREATED',actor.id,null,null,{template_id:id});});return json({id},201);
  }
  const template=path.match(/^\/api\/admin\/templates\/([^/]+)(?:\/(activate|deactivate|duplicate|reset))?$/);
  if(template&&['POST','PATCH'].includes(method)) {
    const id=uuid.parse(template[1]),action=template[2],input=await body(request,action?z.object({revision:z.number().int().positive()}).strict():z.object({name:plain(100).min(1),config:z.unknown(),revision:z.number().int().positive()}).strict());
    return json(await db.transaction(async tx=>{
      // Serialize template publication and editing to avoid two simultaneous active templates.
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('nc.document_templates'))");
      const t=(await tx.query('SELECT * FROM nc.document_templates WHERE id=$1 FOR UPDATE',[id])).rows[0];assert(t,404,'Template not found.');assert(t.revision===input.revision,409,'This template changed. Reload before saving.');
      if(action==='duplicate') {const copy=randomUUID();await tx.query('INSERT INTO nc.document_templates(id,kind,name,draft,updated_by) VALUES($1,$2,$3,$4,$5)',[copy,t.kind,`${t.name.slice(0,90)} copy`,JSON.stringify(t.draft),actor.id]);await audit(tx,'TEMPLATE_DUPLICATED',actor.id,null,null,{template_id:copy,source_id:id});return {id:copy};}
      const revision=t.revision+1;
      if(action==='activate') {
        const config=validateTemplate(t.kind,t.draft);await preview(tx,t.kind,config);
        await tx.query('UPDATE nc.document_templates SET active=false WHERE kind=$1 AND active',[t.kind]);
        await tx.query('INSERT INTO nc.template_revisions(id,template_id,revision,config,actor_id) VALUES($1,$2,$3,$4,$5)',[randomUUID(),id,revision,JSON.stringify(config),actor.id]);
        await tx.query('UPDATE nc.document_templates SET active=true,published_config=$2,published_revision=$3 WHERE id=$1',[id,JSON.stringify(config),revision]);
      } else if(action==='deactivate') await tx.query('UPDATE nc.document_templates SET active=false WHERE id=$1',[id]);
      else {const config=action==='reset'?defaults(t.kind):validateTemplate(t.kind,input.config);await tx.query('UPDATE nc.document_templates SET draft=$2,name=$3 WHERE id=$1',[id,JSON.stringify(config),input.name||t.name]);}
      await tx.query('UPDATE nc.document_templates SET revision=$2,updated_by=$3,updated_at=now() WHERE id=$1',[id,revision,actor.id]);
      await audit(tx,'TEMPLATE_UPDATED',actor.id,null,null,{template_id:id,action:action||'draft',revision});return {id,revision};
    }));
  }
  if(path==='/api/admin/company-assets'&&method==='GET') return json({company:(await db.query('SELECT company_name,founder_name,founder_title,website,identifiers FROM nc.company_settings WHERE id=true')).rows[0],assets:(await db.query('SELECT name,sha256,updated_at,octet_length(png) AS size FROM nc.company_assets')).rows});
  if(path==='/api/admin/company-assets'&&method==='PUT') {
    const p=await body(request,z.object({company_name:plain(100).min(1),founder_name:plain(100).min(1),founder_title:plain(80).min(1),website:z.string().url().max(200).refine(v=>new URL(v).protocol==='https:'),identifiers:plain(180)}).strict());
    await db.transaction(async tx=>{await tx.query('UPDATE nc.company_settings SET company_name=$1,founder_name=$2,founder_title=$3,website=$4,identifiers=$5,updated_by=$6,updated_at=now() WHERE id=true',[p.company_name,p.founder_name,p.founder_title,p.website,p.identifiers,actor.id]);await audit(tx,'COMPANY_SETTINGS_UPDATED',actor.id);});return json({success:true});
  }
  if(path==='/api/admin/company-assets/upload'&&method==='POST') {
    const p=await body(request,z.object({name:z.enum(['authorized_signature','company_logo']),png_base64:z.string().max(700000).regex(/^[A-Za-z0-9+/]+={0,2}$/)}).strict(),710000),bytes=Buffer.from(p.png_base64,'base64');
    assert(bytes.length>=32&&bytes.length<=512000&&bytes.toString('base64')===p.png_base64&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),400,'Upload a valid PNG under 500 KB.');
    assert(bytes.readUInt32BE(16)<=3000&&bytes.readUInt32BE(20)<=3000,400,'PNG dimensions must be at most 3000 pixels.');
    if(p.name==='authorized_signature') {try {await signatureBytes({signatureData:bytes});}catch {assert(false,400,'Signature dimensions must be 20×10 to 2000×1000 pixels.');}}
    try {await (await PDFDocument.create()).embedPng(bytes);} catch {assert(false,400,'The PNG could not be decoded.');}
    await db.transaction(async tx=>{await tx.query(`INSERT INTO nc.company_assets(name,png,sha256,updated_by) VALUES($1,$2,$3,$4) ON CONFLICT(name) DO UPDATE SET png=excluded.png,sha256=excluded.sha256,updated_by=excluded.updated_by,updated_at=now()`,[p.name,bytes,hash(bytes),actor.id]);await audit(tx,p.name==='authorized_signature'?'SIGNATURE_UPDATED':'LOGO_UPDATED',actor.id,null,null,{sha256:hash(bytes)});});return json({success:true});
  }
  return null;
}
