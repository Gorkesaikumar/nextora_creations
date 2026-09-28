import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const fixture=JSON.parse(await readFile('tmp/ui-fixture.json','utf8'));
const password='Test-only-passphrase-2026!';
async function login(page,role='admin') {
  await page.goto(role==='admin'?'/admin/internships':'/internship/certificate');
  await page.getByLabel('Company-registered email').fill(`${role}@example.test`);
  await page.getByLabel('Password',{exact:false}).fill(password);
  await page.getByRole('button',{name:'Sign in',exact:false}).click();
  await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeVisible();
}
test('landing page remains intact and public routes load on direct refresh',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await expect(page.locator('footer').getByRole('link',{name:'Verify Certificate',exact:true})).toHaveAttribute('href','/verify-certificate');
  await page.goto('/internships');
  await expect(page.getByRole('heading',{name:'MBA Marketing Internship',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link',{name:'Access my certificate'})).toBeVisible();
});
test('verification handles verified, revoked, invalid and network-failure states',async({page})=>{
  await page.goto(`/verify-certificate/${fixture.certificate_number}`);
  await expect(page.locator('.nc-status')).toContainText('VERIFIED');
  await expect(page.locator('#nc-verification')).toContainText('Test Student');
  await expect(page.locator('#nc-verification')).not.toContainText('student@example.test');
  await page.screenshot({path:'tmp/verification-desktop.png',fullPage:true});
  await page.goto(`/verify-certificate/${fixture.revoked_number}`);
  await expect(page.locator('.nc-status')).toContainText('CERTIFICATE REVOKED');
  await page.getByLabel('Certificate ID').fill('INVALID');
  await page.getByRole('button',{name:'Verify certificate'}).click();
  await expect(page.locator('.nc-status')).toContainText('CERTIFICATE NOT FOUND');
  await page.route('**/api/verify/*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Service temporarily unavailable.'})}));
  await page.getByRole('button',{name:'Verify certificate'}).click();
  await expect(page.locator('#nc-message')).toContainText('Service temporarily unavailable');
});
test('company workspace is authenticated; admin creates program and internship',async({page})=>{
  await login(page);
  await expect(page.getByText('Total interns',{exact:true})).toBeVisible();
  await page.screenshot({path:'tmp/admin-desktop.png',fullPage:true});
  await page.getByRole('link',{name:'Programs',exact:true}).click();
  const form=page.locator('form[data-form="program"][data-id=""]');
  await form.getByLabel('Program title').fill('Software Development Internship');
  await form.getByLabel('Department').fill('Engineering');
  await form.getByLabel('Publication status').selectOption('ACTIVE');
  await form.getByRole('button',{name:'Create program'}).click();
  await expect(page.locator('#nc-message')).toContainText('Program saved');
  await page.getByRole('link',{name:'Create internship',exact:true}).click();
  await page.getByLabel('Student email').fill('browser-student@example.test');
  await page.getByLabel('Full name').fill('Browser Test Student');
  await page.getByLabel('Internship role').fill('Software Intern');
  await page.getByLabel('Department').fill('Engineering');
  await page.getByLabel('Approved start date').fill('2026-01-01');
  await page.getByLabel('Approved completion date').fill('2026-04-01');
  await page.getByRole('button',{name:'Create internship',exact:true}).click();
  await expect(page.locator('#nc-message')).toContainText('Private invitation created');
  await page.getByRole('link',{name:'Open internship',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Browser Test Student',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Activate internship',exact:true}).click();
  await expect(page.locator('#nc-message')).toContainText('Record updated');
  await page.getByRole('button',{name:'Mark completed',exact:true}).click();
  await expect(page.getByRole('button',{name:'Approve certificate eligibility'})).toBeVisible();
  await page.getByRole('button',{name:'Approve certificate eligibility'}).click();
  await page.getByRole('button',{name:'Generate certificate',exact:true}).click();
  await expect(page.locator('#nc-message')).toContainText('Certificate issued');
  await expect(page.getByRole('link',{name:'Download PDF',exact:true})).toBeVisible();
  await page.screenshot({path:'tmp/admin-record-desktop.png',fullPage:true});
});
test('student sees only own records, can download PDF and cannot enter company workspace',async({page})=>{
  await login(page,'student');
  await expect(page.getByRole('link',{name:'Open internship'})).toHaveCount(1);
  await page.getByRole('link',{name:'Open internship'}).click();
  await expect(page.getByRole('heading',{level:1})).toContainText('Congratulations');
  const download=page.waitForEvent('download');
  await page.getByRole('link',{name:'Download PDF',exact:true}).click();
  expect((await download).suggestedFilename()).toContain(fixture.certificate_number);
  await page.goto('/admin/internships');
  await expect(page.getByRole('heading',{name:'Access restricted.'})).toBeVisible();
});
test('mobile and tablet forms stay usable without page overflow',async({page})=>{
  for(const width of [375,768]) {
    await page.setViewportSize({width,height:900});
    await page.goto(`/verify-certificate/${fixture.certificate_number}`);
    await expect(page.locator('.nc-status')).toContainText('VERIFIED');
    const overflow=await page.locator('.nc-portal').evaluate(el=>el.scrollWidth>el.clientWidth);
    expect(overflow).toBe(false);
    await page.screenshot({path:`tmp/verification-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:375,height:900});
  await page.goto('/internship/certificate');
  await expect(page.getByLabel('Company-registered email')).toBeVisible();
  await page.screenshot({path:'tmp/student-login-mobile.png',fullPage:true});
  await login(page);
  await expect(page.locator('.nc-table-wrap')).toBeVisible();
  expect(await page.locator('.nc-portal').evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(false);
  await page.screenshot({path:'tmp/admin-mobile.png',fullPage:true});
});
