import './portal.css';
import { mountAdmin } from './admin-portal.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const pretty = value => String(value || '').replaceAll('_', ' ');
const date = value => value ? new Date(`${String(value).slice(0,10)}T00:00:00Z`).toLocaleDateString('en-GB', { day:'2-digit',month:'short',year:'numeric',timeZone:'UTC' }) : 'Not set';
const tag = value => `<span class="nc-tag">${esc(pretty(value))}</span>`;
const button = (text, action, style = '') => `<button type="button" class="nc-button ${style}" data-action="${esc(action)}">${esc(text)}</button>`;
const link = (text, href, style = '') => `<a class="nc-button ${style}" href="${esc(href)}">${esc(text)}</a>`;
const field = (name, label, value = '', type = 'text', required = true, extra = '') => `<label class="nc-field"><span class="nc-label">${esc(label)}${required ? ' *' : ''}</span><input name="${esc(name)}" type="${type}" value="${esc(value)}" ${required?'required':''} ${extra}></label>`;
const select = (name, label, options, value) => `<label class="nc-field"><span class="nc-label">${esc(label)}</span><select name="${esc(name)}" required>${options.map(([key,label])=>`<option value="${esc(key)}" ${key===value?'selected':''}>${esc(label)}</option>`).join('')}</select></label>`;
const detail = (label, value, wide = false) => `<div class="${wide?'wide':''}"><dt>${esc(label)}</dt><dd>${esc(value || 'Not provided')}</dd></div>`;
const states = ['INVITED','REGISTERED','APPROVED','OFFER_LETTER_ISSUED','ACTIVE','COMPLETED','CERTIFICATE_ELIGIBLE','CERTIFICATE_ISSUED','REJECTED','TERMINATED','CERTIFICATE_REVOKED'];
const nextStates = { INVITED:['REGISTERED','APPROVED','ACTIVE','REJECTED'],REGISTERED:['APPROVED','ACTIVE','REJECTED'],APPROVED:['REJECTED'],OFFER_LETTER_ISSUED:['ACTIVE','TERMINATED'],ACTIVE:['COMPLETED','TERMINATED'],COMPLETED:['CERTIFICATE_ELIGIBLE','REJECTED'],CERTIFICATE_ELIGIBLE:['COMPLETED','REJECTED'],REJECTED:['ACTIVE'],TERMINATED:[],CERTIFICATE_ISSUED:[],CERTIFICATE_REVOKED:[] };
const stateLabel = s => ({APPROVED:'Approve intern',CERTIFICATE_ELIGIBLE:'Approve certificate eligibility',COMPLETED:'Mark completed',ACTIVE:'Activate internship',REJECTED:'Reject eligibility',TERMINATED:'Terminate internship',REGISTERED:'Mark registered'}[s] || pretty(s));
let verificationKind='certificate';
let root, session = null, record = null, programs = [], inviteToken = null, admin = false;
const messages = '<div id="nc-message" class="nc-message" role="status" aria-live="polite"></div>';
const heading = (eyebrow, title, description) => `<p class="nc-eyebrow">${eyebrow}</p><h1 class="nc-heading">${title}</h1><p class="nc-lead">${description}</p>`;
function message(text, kind = 'error') {
  const target = document.querySelector('#nc-message');
  if (target) { target.className=`nc-message nc-note ${kind}`; target.textContent=text; target.scrollIntoView({block:'nearest',behavior:'smooth'}); }
}
async function api(path, {method='GET',data}={}) {
  const response = await fetch(`/api${path}`, { method, credentials:'same-origin', headers: {
    ...(data !== undefined ? {'Content-Type':'application/json'} : {}),
    ...(method!=='GET' && session ? {'X-CSRF-Token':session.csrf_token} : {}),
  }, ...(data !== undefined ? {body:JSON.stringify(data)} : {}) });
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new Error('The internship service is unavailable. Please contact Nextora Creations.');
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || result.message || 'The request could not be completed.');
    error.status=response.status; error.result=result;
    if (result.fields?.length) error.message += ` ${result.fields.map(f=>`${f.field || 'Form'}: ${f.message}`).join(' · ')}`;
    throw error;
  }
  return result;
}
const getSession = async () => { try { session = await api('/auth/me'); } catch(error) { if(error.status!==401) throw error; session=null; } };
function accountBar() {
  return `<div class="nc-topline"><p class="nc-eyebrow">${admin?'Company workspace':'Student workspace'}</p><div>${esc(session.user.email)} <button class="nc-link" data-action="logout" type="button">Sign out</button></div></div>`;
}
const profileFields = s => `<div class="nc-form-grid">${field('full_name','Full name',s.full_name,'text',true,'maxlength="100" autocomplete="name"')}${field('phone_number','Phone number',s.phone_number,'tel',false,'maxlength="32" autocomplete="tel"')}${field('college_name','College name',s.college_name,'text',false,'maxlength="160"')}${field('university_name','University name',s.university_name,'text',false,'maxlength="160"')}${field('course','Course',s.course,'text',false,'maxlength="100"')}${field('specialization','Specialization',s.specialization,'text',false,'maxlength="100"')}${field('registration_number','Student registration number',s.registration_number,'text',false,'maxlength="100"')}</div>`;
function login() {
  root.innerHTML = heading(admin?'Company access':'Your next chapter','Recognition.<br><span>Earned.</span>',admin?'Sign in to manage internships, review completion and issue company-approved certificates.':'Access the official record of your internship and download your certificate after completion and approval.') + messages +
    `<div class="nc-columns"><section class="nc-panel"><h2>${inviteToken?'Activate your account':admin?'Administrator sign in':'Student sign in'}</h2><form class="nc-form" data-form="${inviteToken?'activate':'login'}">
    ${field('email','Company-registered email','','email',true,'autocomplete="username" maxlength="254"')}
    ${field('password',inviteToken?'Create password':'Password','','password',true,`autocomplete="${inviteToken?'new-password':'current-password'}" ${inviteToken?'minlength="12"':''} maxlength="128"`)}
    ${inviteToken?'<p class="nc-help">Use at least 12 characters. Your private invitation expires after 48 hours.</p>':''}
    <button class="nc-button" type="submit">${inviteToken?'Activate account':'Sign in'} <span aria-hidden="true">→</span></button></form>
    <p class="nc-help">${admin?'Company accounts are provisioned by the site administrator.':'Use the account linked to your Nextora internship. For first access or a password reset, request a private invitation from the company.'}</p>
    <a class="nc-link" href="mailto:support@nextoracreations.co.in">Contact Nextora Creations</a></section>
    <aside class="nc-panel nc-dark"><p class="nc-eyebrow">Official internship records</p><h2>Built on real experience.</h2><p>Every certificate represents an internship completed and approved by Nextora Creations.</p>
    <ol class="nc-steps"><li><span>01</span><div><strong>Complete your internship</strong><p>Meet your program’s duration and complete your assigned work.</p></div></li><li><span>02</span><div><strong>Confirm your details</strong><p>Check the name and academic details on your company-created record.</p></div></li><li><span>03</span><div><strong>Receive your certificate</strong><p>After company approval, download a certificate with a unique ID and verification QR.</p></div></li></ol>
    <a href="/verify-certificate">Here to verify a certificate? →</a></aside></div>`;
}
async function publicPrograms() {
  root.innerHTML = heading('Nextora internships','Real work.<br><span>Lasting impact.</span>','Build practical experience with Nextora Creations. Explore our active programs and access your company-approved internship record.') + messages +
    `<div class="nc-actions">${link('Access my certificate','/internship/certificate')}${link('Verify a certificate','/verify-certificate','secondary')}</div><div id="nc-programs" class="nc-programs"><p class="nc-loading">Loading programs…</p></div>`;
  try {
    const {programs} = await api('/programs');
    document.querySelector('#nc-programs').innerHTML = programs.length ? programs.map(p=>`<article class="nc-program">${tag(p.department)}<h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><dl class="nc-details">${detail('Program duration',`${p.duration_months} months`)}${detail('Certificate minimum',`${p.minimum_duration_months} calendar months`)}</dl><a class="nc-link" href="/internships/${esc(p.slug)}">View program & apply →</a></article>`).join('') : '<div class="nc-empty"><strong>New opportunities take shape here.</strong>No programs are currently published. Contact <a class="nc-link" href="mailto:support@nextoracreations.co.in">Nextora Creations</a> for upcoming internships.</div>';
  } catch(error) { document.querySelector('#nc-programs').innerHTML=''; message(error.message); }
}
async function publicProgram() {
  const p=(await api(`/programs/${encodeURIComponent(location.pathname.split('/')[2])}`)).program;
  const accepting=p.applications_enabled&&['ACTIVE','PUBLISHED'].includes(p.status)&&(!p.application_deadline||p.application_deadline>=new Date().toISOString().slice(0,10));
  root.innerHTML=link('All internships','/internships','secondary')+heading(esc(p.department),esc(p.title),esc(p.description))+messages+`<div class="nc-columns"><section class="nc-panel">${tag(p.status)}<dl class="nc-details">${detail('Role',p.role)}${detail('Duration',p.duration_months+' months')}${detail('Work mode',p.work_mode)}${detail('Location',p.location)}${detail('Application deadline',date(p.application_deadline))}${detail('Positions',p.positions)}</dl><h2>Responsibilities</h2><p class="nc-preserve">${esc(p.responsibilities)}</p><h2>Requirements</h2><p class="nc-preserve">${esc(p.skills)}</p><h2>Eligibility</h2><p class="nc-preserve">${esc(p.eligibility)}</p></section><aside class="nc-panel"><h2>Apply for internship</h2>${accepting?`<form class="nc-form" data-form="application">${field('email','Email','','email')}${profileFields({})}<label class="nc-field"><span class="nc-label">Why this internship?</span><textarea name="motivation" maxlength="1500"></textarea></label><p class="nc-help">Your application is reviewed by Nextora management. Applying does not create a certificate or confirm acceptance.</p><button class="nc-button">Apply for internship</button></form>`:'<p>Applications are currently closed.</p>'}</aside></div>`;
}
async function verification(number = '',kind='certificate') {
  verificationKind=kind;
  root.innerHTML = heading('Official certificate verification','Experience.<br><span>Verified.</span>','Confirm that an internship certificate was issued by Nextora Creations. Enter its certificate ID or scan the QR printed on the certificate.') + messages +
    `<div class="nc-columns"><section><div class="nc-panel"><form class="nc-form" data-form="verify">${field('certificate_number','Certificate ID',number,'text',true,'maxlength="64" autocomplete="off" spellcheck="false" placeholder="NC-INT-2026-…"')}<button class="nc-button" type="submit">Verify certificate <span aria-hidden="true">↗</span></button></form></div><div id="nc-verification" aria-live="polite"></div></section>
    <aside class="nc-panel nc-dark"><p class="nc-eyebrow">Trust the source</p><h2>A record you can rely on.</h2><p>This page checks Nextora’s official issuance records. A valid record confirms the internship role, period and certificate status.</p><ol class="nc-steps"><li><span>01</span><div><strong>Check the domain</strong><p>Official QR codes lead to nextoracreations.co.in.</p></div></li><li><span>02</span><div><strong>Match the details</strong><p>Compare the name, role and dates below with the certificate you received.</p></div></li><li><span>03</span><div><strong>Review the status</strong><p>A revoked certificate is no longer valid, even if you have a downloaded copy.</p></div></li></ol></aside></div>`;
  if(kind==='offer') root.innerHTML=root.innerHTML.replaceAll('certificate','offer letter').replaceAll('Certificate','Offer Letter').replaceAll('NC-INT','NC-OFFER').replaceAll('name="offer letter_number"','name="certificate_number"');
  if(number) await verify(number);
}
async function verify(number) {
  const target=document.querySelector('#nc-verification');
  target.innerHTML='<p class="nc-loading">Checking the official record…</p>';
  try {
    const c=await api(`/${verificationKind==='offer'?'verify-offer':'verify'}/${encodeURIComponent(number.trim().toUpperCase())}`);
    const revoked=c.status==='REVOKED';
    target.innerHTML=`<section class="nc-panel nc-section"><div class="nc-status ${revoked?'revoked':'verified'}"><span class="nc-status-icon" aria-hidden="true">${revoked?'!':'✓'}</span>${revoked?'CERTIFICATE REVOKED':'VERIFIED'}</div>${revoked?'<p>This certificate has been revoked by Nextora Creations and is no longer valid.</p>':''}<h2>${esc(c.student_name)}</h2><dl class="nc-details">${detail(verificationKind==='offer'?'Offer Letter ID':'Certificate ID',c.certificate_number||c.offer_number,true)}${detail('Internship role',c.role)}${detail('Internship program',c.program)}${detail('Internship period',`${date(c.start_date)} – ${date(c.end_date)}`,true)}${detail('Issue date',date(c.issued_at))}${detail('Certificate status',revoked?'Revoked':'Valid')}</dl><p class="nc-help">Issued by Nextora Creations</p></section>`;
  } catch(error) {
    target.innerHTML=error.result?.status==='NOT_FOUND'?'<section class="nc-panel nc-section"><div class="nc-status revoked"><span class="nc-status-icon" aria-hidden="true">?</span>CERTIFICATE NOT FOUND</div><p>The certificate ID provided could not be verified as a certificate issued through this system.</p><a class="nc-link" href="mailto:support@nextoracreations.co.in">Contact Nextora Creations</a></section>':'';
    if(error.result?.status!=='NOT_FOUND') message(error.message);
  }
  if(verificationKind==='offer') target.innerHTML=target.innerHTML.replaceAll('CERTIFICATE','OFFER LETTER').replaceAll('certificate','offer letter').replaceAll('Certificate','Offer Letter');
}
function passwordForm() {
  return `<details class="nc-section"><summary>Account security</summary><form class="nc-form nc-panel" data-form="password"><h2>Change password</h2><div class="nc-form-grid">${field('current_password','Current password','','password',true,'autocomplete="current-password" maxlength="128"')}${field('password','New password','','password',true,'autocomplete="new-password" minlength="12" maxlength="128"')}</div><p class="nc-help">Changing your password signs out all sessions.</p><button type="submit" class="nc-button">Update password</button></form></details>`;
}
function recordDetails(i) {
  return `<dl class="nc-details">${detail('Internship ID',i.id,true)}${detail('Program',i.program_title)}${detail('Role',i.role)}${detail('Start date',date(i.start_date))}${detail('Completion date',date(i.end_date))}${detail('Minimum duration',`${i.minimum_duration_months} calendar months`)}${detail('Eligible from',date(i.eligible_date))}${detail('Department',i.department)}${detail('Supervisor',i.mentor)}${detail('Project / work completed',i.project,true)}</dl>`;
}
async function studentPage() {
  const id=location.pathname.split('/')[3];
  if(id) {
    record=(await api(`/me/internships/${encodeURIComponent(id)}`)).internship;
    const i=record, issued=Boolean(i.certificate_number), revoked=i.certificate_status==='REVOKED';
    root.innerHTML=accountBar()+`<a class="nc-back" href="/internship/certificate">← All my internships</a>`+heading('Your official internship record',issued&&!revoked?`Congratulations,<br><span>${esc(i.certificate_student_name)}.</span>`:'Your experience.<br><span>Your record.</span>',issued&&!revoked?'Your internship is complete. Your official certificate is ready.':'Review your approved internship details and follow your certificate status.')+messages+
      `<div class="nc-columns"><section class="nc-panel">${tag(i.status)}${recordDetails({...i,program_title:i.certificate_program||i.program_title})}${issued?`<dl class="nc-details">${detail('Certificate ID',i.certificate_number,true)}${detail('Name at issue',i.certificate_student_name)}${detail('Certificate status',i.certificate_status)}${detail('Issue date',date(i.issued_at))}</dl>`:''}
      ${revoked?'<div class="nc-note error">CERTIFICATE REVOKED. This certificate is no longer valid. Contact Nextora Creations.</div>':i.eligible?'<div class="nc-note success">Your internship is approved for certificate issuance.</div>':!issued?'<div class="nc-note">Your internship certificate will become available after successful completion of your internship and company approval.</div>':''}
      <div class="nc-actions">${i.eligible?button('Get my certificate','issue'):''}${issued&&!revoked?`${link('View certificate',`/api/me/internships/${i.id}/pdf?view=1`,'secondary')}${link('Download PDF',`/api/me/internships/${i.id}/pdf`)}`:''}${issued?link('Verify certificate',`/verify-certificate/${i.certificate_number}`,'secondary'):''}</div>${i.offer_number?`<h2 class="nc-section">Offer letter</h2>${tag(i.offer_status)}<p>${esc(i.offer_number)} · ${date(i.offer_issued_at)}</p><div class="nc-actions">${i.offer_status==='VALID'?link('View offer',`/api/me/internships/${i.id}/offer-pdf?view=1`,'secondary')+link('Download offer PDF',`/api/me/internships/${i.id}/offer-pdf`):''}${link('Verify offer',`/verify-offer/${i.offer_number}`,'secondary')}</div>`:''}</section>
      <aside class="nc-panel"><h2>Confirm your details</h2><p>Your dates, role and approval are maintained by Nextora. Contact the company for corrections to those fields.</p><form class="nc-form" data-form="details">${field('email','Registered email',i.email,'email',false,'readonly')}${profileFields(i)}<p class="nc-help">${i.details_confirmed_at?'Last confirmed '+date(i.details_confirmed_at)+'. ':''}These details help the company review your certificate. Issued certificates retain the information approved at issue.</p><button class="nc-button" type="submit" ${i.status==='CERTIFICATE_ELIGIBLE'?'disabled':''}>Confirm details</button></form></aside></div>`+passwordForm();
  } else {
    const page=Number(new URLSearchParams(location.search).get('page')||1);
    const result=await api(`/me/internships?page=${page}`);
    root.innerHTML=accountBar()+heading('Student certificate portal','Your work.<br><span>Recognized.</span>','Choose your company-created internship record to confirm your details, review eligibility and download your certificate.')+messages+
      (result.internships.length?`<div class="nc-programs">${result.internships.map(i=>`<article class="nc-panel">${tag(i.status)}<h2 class="nc-section">${esc(i.program_title)}</h2><p>${esc(i.role)}</p><dl class="nc-details">${detail('Start date',date(i.start_date))}${detail('Completion date',date(i.end_date))}</dl>${link('Open internship',`/internship/certificate/${i.id}`)}</article>`).join('')}</div>${pagination(result,'/internship/certificate')}`:'<div class="nc-empty"><strong>No internship record found</strong>We could not find an eligible internship record for these details. Please contact Nextora Creations.</div>')+passwordForm();
  }
}
function adminTabs(tab) {
  return `<nav class="nc-tabs" aria-label="Internship management"><a href="/admin/internships" ${tab==='internships'?'aria-current="page"':''}>Internships</a><a href="/admin/internships?tab=programs" ${tab==='programs'?'aria-current="page"':''}>Programs</a><a href="/admin/internships?tab=new" ${tab==='new'?'aria-current="page"':''}>Create internship</a></nav>`;
}
const programOptions = () => programs.map(p=>[p.id,`${p.title}${p.status!=='ACTIVE'?' ('+p.status.toLowerCase()+')':''}`]);
function internshipForm(i={}) {
  return `<div class="nc-form-grid">${select('program_id','Internship program',programOptions(),i.program_id)}${field('role','Internship role',i.role,'text',true,'maxlength="120"')}${field('department','Department',i.department,'text',true,'maxlength="100"')}${field('start_date','Approved start date',i.start_date,'date')}${field('end_date','Approved completion date',i.end_date,'date')}${field('mentor','Supervisor',i.mentor,'text',false,'maxlength="120"')}</div>${field('project','Project / work completed',i.project,'text',false,'maxlength="400"')}`;
}
function programForm(p={}) {
  return `<form class="nc-form nc-panel" data-form="program" data-id="${esc(p.id||'')}"><h2>${p.id?'Edit program':'Create a program'}</h2><div class="nc-form-grid">${field('title','Program title',p.title,'text',true,'maxlength="120"')}${field('department','Department',p.department,'text',true,'maxlength="100"')}${field('duration_months','Duration (months)',p.duration_months||3,'number',true,'min="1" max="60"')}${field('minimum_duration_months','Minimum duration (months)',p.minimum_duration_months||3,'number',true,'min="1" max="60"')}${field('start_date','Program start',p.start_date,'date',false)}${field('end_date','Program end',p.end_date,'date',false)}${select('status','Publication status',['DRAFT','ACTIVE','PUBLISHED','CLOSED','ARCHIVED'].map(x=>[x,pretty(x)]),p.status||'DRAFT')}</div><label class="nc-field"><span class="nc-label">Description</span><textarea name="description" maxlength="2000">${esc(p.description)}</textarea></label><p class="nc-help">Template: Nextora A4 landscape. Minimum duration defaults to three calendar months. Changes apply to new enrollments; existing requirements and issued certificates remain preserved.</p><button class="nc-button" type="submit">${p.id?'Save program':'Create program'}</button></form>`;
}
function pagination(result, path) {
  const query=new URLSearchParams(location.search);
  query.set('page',String(result.page-1)); const prev=`${path}?${query}`;
  query.set('page',String(result.page+1)); const next=`${path}?${query}`;
  return `<div class="nc-actions"><span class="nc-help">${result.total} records · Page ${result.page}</span>${result.page>1?link('Previous',prev,'secondary'):''}${result.page*25<result.total?link('Next',next,'secondary'):''}</div>`;
}
async function adminPage() {
  const params=new URLSearchParams(location.search), tab=params.get('tab')||'internships', id=params.get('id');
  programs=(await api('/admin/programs')).programs;
  const base=accountBar()+heading('Internship management','Build careers.<br><span>Keep the record.</span>','Manage programs and internship records. Review completed work before approving a certificate.')+adminTabs(tab)+messages;
  if(id) {
    record=(await api(`/admin/internships/${encodeURIComponent(id)}`)).internship;
    const i=record;
    root.innerHTML=base+`<a class="nc-back" href="/admin/internships">← Back to all internships</a><div class="nc-columns"><section class="nc-panel"><div class="nc-topline"><h2>${esc(i.full_name)}</h2>${tag(i.status)}</div><p>${esc(i.email)}</p>${recordDetails(i)}<dl class="nc-details">${detail('College',i.college_name)}${detail('University',i.university_name)}${detail('Course',i.course)}${detail('Specialization',i.specialization)}${detail('Registration number',i.registration_number)}${detail('Phone',i.phone_number)}${detail('Student confirmation',i.details_confirmed_at?date(i.details_confirmed_at):'Awaiting confirmation')}${detail('Company approval',i.admin_approved?'Approved':'Not approved')}</dl>
      ${i.certificate_number?`<dl class="nc-details">${detail('Certificate ID',i.certificate_number,true)}${detail('Name at issue',i.certificate_student_name)}${detail('Program at issue',i.certificate_program)}${detail('Certificate status',i.certificate_status)}${detail('Issued',date(i.issued_at))}</dl>`:''}
      <div class="nc-actions">${i.certificate_status==='VALID'?`${link('View certificate',`/api/admin/internships/${i.id}/pdf?view=1`,'secondary')}${link('Download PDF',`/api/admin/internships/${i.id}/pdf`)}`:''}${i.certificate_number?link('Public verification',`/verify-certificate/${i.certificate_number}`,'secondary'):''}</div>
      ${!i.certificate_number?`<details class="nc-section"><summary>Edit approved internship information</summary><form class="nc-form" data-form="edit-internship">${internshipForm(i)}<p class="nc-help">Saving changes clears existing certificate approval. Issued records cannot be edited.</p><button class="nc-button" type="submit">Save changes</button></form></details>`:''}</section>
      <aside><section class="nc-panel"><h2>Review &amp; approval</h2><p>${i.duration_met?'The approved period meets the required duration. Confirm successful completion and check the student’s details before approval.':'The internship cannot be completed or approved until the required duration and approved end date are reached.'}</p>
      <div class="nc-actions">${(nextStates[i.status]||[]).filter(s=>i.workflow_version!==2||s!=='ACTIVE'||i.status==='OFFER_LETTER_ISSUED').map(s=>button(stateLabel(s),`status:${s}`,s==='REJECTED'||s==='TERMINATED'?'danger':'secondary')).join('')}${i.status==='APPROVED'?button('Issue offer letter','offer'):''}${i.eligible?button('Generate certificate','issue'):''}</div>
      ${i.certificate_status==='VALID'?`<details class="nc-section"><summary>Certificate controls</summary><p class="nc-help">Regeneration preserves the certificate ID and original approved information, and adds a PDF revision.</p>${button('Regenerate PDF','regenerate','secondary')}<form class="nc-form nc-section" data-form="revoke">${field('reason','Reason for revocation','','text',true,'minlength="5" maxlength="500"')}<p class="nc-help">Revocation is permanent. Public verification will show REVOKED and further downloads will be disabled.</p><button class="nc-button danger" type="submit">Revoke certificate</button></form></details>`:''}
      <details class="nc-section"><summary>Student access</summary><p class="nc-help">Create a private invitation for first access or account recovery. It expires in 48 hours. Verify the student’s identity before sharing. Activating it replaces the password and ends previous sessions.</p>${button('Create private invitation','invite','secondary')}<div id="nc-invite"></div></details></section>
      <section class="nc-panel nc-section"><h2>Certificate history</h2><div id="nc-history" aria-live="polite">Loading history…</div></section></aside></div>`;
    await loadHistory();
  } else if(tab==='programs') {
    root.innerHTML=base+`<div class="nc-columns"><section>${programs.length?programs.map(p=>`<details class="nc-panel" style="margin-bottom:20px"><summary>${esc(p.title)} · ${esc(p.status)}</summary>${programForm(p)}</details>`).join(''):'<div class="nc-empty"><strong>No programs yet</strong>Create a program before enrolling an intern.</div>'}</section><aside>${programForm()}</aside></div>`;
  } else if(tab==='new') {
    root.innerHTML=base+(programs.some(p=>['ACTIVE','PUBLISHED'].includes(p.status))?`<form class="nc-form nc-panel" data-form="create-internship"><h2>Student information</h2><p class="nc-help">An existing student is matched by email and retains their saved profile. New students receive a private activation invitation.</p>${field('email','Student email','','email',true,'maxlength="254"')}${profileFields({})}<h2 class="nc-section">Approved internship</h2>${internshipForm()}<button class="nc-button" type="submit">Create internship</button></form>`:`<div class="nc-empty"><strong>Create an active program first</strong>${link('Manage programs','/admin/internships?tab=programs')}</div>`);
  } else {
    const summary=await api('/admin/summary');
    const result=await api(`/admin/internships?${params}`);
    root.innerHTML=base+`<div class="nc-stats">${[['total','Total interns'],['active','Active interns'],['completed','Completed internships'],['eligible','Certificates eligible'],['issued','Certificates issued'],['revoked','Revoked certificates']].map(([key,label])=>`<div class="nc-stat"><strong>${summary[key]}</strong><span>${label}</span></div>`).join('')}</div>
      <form class="nc-filter" data-form="filter">${field('search','Search name, email or internship ID',params.get('search'),'search',false,'maxlength="100"')}${select('status','Status',[['','All statuses'],...states.map(s=>[s,pretty(s)])],params.get('status')||'')}<button class="nc-button secondary" type="submit">Apply filters</button></form>
      ${result.internships.length?`<div class="nc-table-wrap" tabindex="0" aria-label="Internship records, scroll horizontally on small screens"><table class="nc-table"><thead><tr><th>Student</th><th>Internship</th><th>Status</th><th>Record</th></tr></thead><tbody>${result.internships.map(i=>`<tr><td><strong>${esc(i.full_name)}</strong><small>${esc(i.email)}</small></td><td><strong>${esc(i.program_title)}</strong><small>${date(i.start_date)} – ${date(i.end_date)}</small></td><td>${tag(i.status)}</td><td><a href="/admin/internships?id=${i.id}" aria-label="Open record for ${esc(i.full_name)}">Open →</a></td></tr>`).join('')}</tbody></table></div>${pagination(result,'/admin/internships')}`:'<div class="nc-empty"><strong>No matching internships</strong>Create a student internship or adjust your search filters.</div>'}`+passwordForm();
  }
}
async function loadHistory(before) {
  const result=await api(`/admin/internships/${record.id}/history${before?'?before='+encodeURIComponent(before):''}`);
  const target=document.querySelector('#nc-history');
  const items=result.history.map(h=>`<li><strong>${esc(pretty(h.event))}</strong><time>${esc(new Date(h.created_at).toLocaleString())}</time><small>Actor: ${esc(h.actor_id)}</small>${h.metadata.reason?`<p>${esc(h.metadata.reason)}</p>`:''}${h.metadata.revision?`<small>PDF revision ${h.metadata.revision}</small>`:''}</li>`).join('');
  if(!before) target.innerHTML=`<ol class="nc-history">${items}</ol>`;
  else target.querySelector('ol').insertAdjacentHTML('beforeend',items);
  target.querySelector('[data-action^="history:"]')?.remove();
  if(result.history.length===100) target.insertAdjacentHTML('beforeend',button('Earlier history',`history:${result.history.at(-1).id}`,'secondary'));
}
function showInvitation(url, id) {
  const html=`<div class="nc-note success">Private invitation created. Share this link only with the verified student.<span class="nc-invite">${esc(url)}</span><p class="nc-help">Visible here once. You can generate a replacement from the student record.</p>${id?link('Open internship',`/admin/internships?id=${id}`,'secondary'):''}</div>`;
  const target=document.querySelector('#nc-invite')||document.querySelector('#nc-message');
  target.innerHTML=html;
  target.scrollIntoView({block:'nearest'});
}
async function renderPrivate() {
  if(!session) return login();
  if(admin && session.user.role!=='ADMIN') {
    root.innerHTML=heading('Company access','Access restricted.','A company administrator account is required to manage internships.')+messages+button('Sign out','logout','secondary')+link('My internships','/internship/certificate');
    return;
  }
  if(session.user.must_change_password) {root.innerHTML=heading('Account security','Change your temporary password.','Set a new password before accessing administration.')+messages+passwordForm().replace('<details class="nc-section">','<details class="nc-section" open>');return;}
  if(admin&&location.pathname!=='/admin/internships') await mountAdmin({root,api,session,message,passwordForm});
  else if(admin) await adminPage(); else await studentPage();
}
async function submit(event) {
  const form=event.target.closest('[data-form]'); if(!form) return;
  event.preventDefault();
  if(form.dataset.busy) return;
  form.dataset.busy='true';
  const controls=[...form.querySelectorAll('button[type="submit"]')]; controls.forEach(x=>x.disabled=true);
  const values=Object.fromEntries(new FormData(form)), kind=form.dataset.form;
  try {
    if(kind==='login'||kind==='activate') {
      session=await api(`/auth/${kind}`,{method:'POST',data:{...values,...(kind==='activate'?{token:inviteToken}:{})}});
      inviteToken=null;
      await renderPrivate();
      window.scrollTo(0,0);
    } else if(kind==='verify') {
      const number=values.certificate_number.trim().toUpperCase();
      history.replaceState(null,'',`/verify-${verificationKind}/${encodeURIComponent(number)}`);
      await verify(number);
    } else if(kind==='application') {
      const {motivation,...student}=values;
      const r=await api(`/programs/${encodeURIComponent(location.pathname.split('/')[2])}/applications`,{method:'POST',data:{student,motivation}});
      form.reset();message(r.message,'success');
    } else if(kind==='filter') {
      location.href=`/admin/internships?${new URLSearchParams(values)}`;
    } else if(kind==='program') {
      const id=form.dataset.id;
      const existing=programs.find(p=>p.id===id)||{};
      const extra=Object.fromEntries(['slug','role','responsibilities','skills','eligibility','application_deadline','internship_type','location','work_mode','positions','applications_enabled'].filter(k=>k in existing).map(k=>[k,existing[k]]));
      await api(`/admin/programs${id?'/'+id:''}`,{method:id?'PATCH':'POST',data:{...extra,...values,duration_months:Number(values.duration_months),minimum_duration_months:Number(values.minimum_duration_months),start_date:values.start_date||null,end_date:values.end_date||null,certificate_template:'nextora-v1'}});
      await adminPage(); message('Program saved.','success');
    } else if(kind==='create-internship') {
      const {email,full_name,phone_number,college_name,university_name,course,specialization,registration_number,...internship}=values;
      const result=await api('/admin/internships',{method:'POST',data:{student:{email,full_name,phone_number,college_name,university_name,course,specialization,registration_number},internship}});
      form.reset();
      if(result.invitation_url) showInvitation(result.invitation_url,result.internship.id);
      else location.href=`/admin/internships?id=${result.internship.id}`;
    } else if(kind==='edit-internship') {
      await api(`/admin/internships/${record.id}`,{method:'PATCH',data:values}); await adminPage(); message('Internship saved. Certificate approval has been cleared.','success');
    } else if(kind==='details') {
      delete values.email;
      await api(`/me/internships/${record.id}/details`,{method:'PATCH',data:values}); await studentPage(); message('Your details have been confirmed.','success');
    } else if(kind==='revoke') {
      await api(`/admin/internships/${record.id}/revoke`,{method:'POST',data:values}); await adminPage(); message('Certificate revoked. Public verification now shows REVOKED.','success');
    } else if(kind==='password') {
      await api('/auth/password',{method:'POST',data:values}); session=null; login(); message('Password changed. Sign in with your new password.','success');
    }
  } catch(error) { message(error.message); }
  finally { delete form.dataset.busy; controls.forEach(x=>x.disabled=false); }
}
async function action(event) {
  const target=event.target.closest('[data-action]'); if(!target||target.disabled) return;
  target.disabled=true;
  const action=target.dataset.action;
  try {
    if(action==='logout') { await api('/auth/logout',{method:'POST',data:{}}); session=null; login(); }
    else if(action.startsWith('history:')) await loadHistory(action.slice(8));
    else {
      const base=`/${admin?'admin':'me'}/internships/${record.id}`;
      if(action.startsWith('status:')) await api(`${base}/status`,{method:'POST',data:{status:action.slice(7)}});
      else {
        const result=await api(`${base}/${action}`,{method:'POST',data:{}});
        if(action==='invite') { showInvitation(result.invitation_url); return; }
      }
      await renderPrivate(); message(action==='issue'?'Certificate issued. Your PDF is ready.':action==='regenerate'?'PDF regenerated with the original certificate information.':'Record updated.','success');
    }
  } catch(error) { message(error.message); }
  finally { target.disabled=false; }
}
export function mountInternships() {
  if(!/^\/(internships(?:\/[^/]+)?\/?$|internship\/certificate(?:\/[^/]+)?\/?$|verify-(?:certificate|offer)(?:\/[^/]+)?\/?$|admin(?:\/.*)?$)/.test(location.pathname)) return;
  document.body.classList.add('internship-route');
  document.querySelectorAll('nav a[href^="#"],footer a[href^="#"]').forEach(a=>a.setAttribute('href','/'+a.getAttribute('href')));
  document.querySelector('meta[name="viewport"]').content='width=device-width, initial-scale=1.0';
  document.querySelector('link[rel="canonical"]').href=`https://nextoracreations.co.in${location.pathname}`;
  document.querySelector('meta[name="robots"]').content='noindex, nofollow';
  admin=/^\/admin(?:\/|$)/.test(location.pathname);
  document.title=`${admin?'Internship Management':location.pathname.startsWith('/verify-certificate')?'Verify Certificate':'Internships'} | Nextora Creations`;
  const fragment=new URLSearchParams(location.hash.slice(1));
  inviteToken=fragment.get('invite');
  if(inviteToken) history.replaceState(null,'',location.pathname+location.search);
  root=document.querySelector('main'); root.className='nc-portal'; root.id='nc-portal';
  root.innerHTML=messages+'<p class="nc-loading" role="status">Loading Nextora internship services…</p>';
  root.addEventListener('submit',submit); root.addEventListener('click',action);
  (async()=>{
    try {
      if(location.pathname.startsWith('/verify-')) await verification(decodeURIComponent(location.pathname.split('/')[2]||''),location.pathname.startsWith('/verify-offer')?'offer':'certificate');
      else if(location.pathname.replace(/\/$/,'')==='/internships') await publicPrograms();
      else if(location.pathname.startsWith('/internships/')) await publicProgram();
      else { await getSession(); if(inviteToken){session=null;login();} else await renderPrivate(); }
    } catch(error) {
      root.innerHTML=heading('Nextora internship services','We couldn’t load<br><span>your record.</span>','Please try again shortly or contact Nextora Creations for assistance.')+messages+`<div class="nc-actions">${link('Try again',location.pathname,'secondary')}${link('Contact support','mailto:support@nextoracreations.co.in','secondary')}</div>`;
      message(error.message);
    }
  })();
}
