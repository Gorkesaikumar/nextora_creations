import { test, expect } from '@playwright/test';
const password='Test-only-passphrase-2026!';
async function login(page,email='admin@example.test') {
  await page.goto('/admin/login');
  await page.getByLabel('Company-registered email').fill(email);
  await page.getByLabel(/^Password/).fill(password);
  await page.getByRole('button',{name:'Sign in',exact:false}).click();
}

test('new admin publishes a program and completes the offer-to-certificate workflow',async({page})=>{
  await login(page);
  await expect(page.getByRole('heading',{name:'A clear view of every internship.'})).toBeVisible();
  await page.screenshot({path:'tmp/admin-dashboard-new.png',fullPage:true});
  await page.getByRole('link',{name:'Internship Programs',exact:true}).click();
  await page.getByText('Create a program',{exact:true}).click();
  const form=page.locator('[data-admin-form="program"][data-id=""]');
  await form.getByLabel('Program name',{exact:true}).fill('Public Browser Marketing Program');
  await form.getByLabel('Slug',{exact:true}).fill('public-browser-marketing');
  await form.getByLabel('Department',{exact:true}).fill('Marketing');
  await form.getByLabel('Role',{exact:true}).fill('Marketing Intern');
  await form.getByRole('combobox',{name:'Status',exact:true}).selectOption('PUBLISHED');
  await form.getByLabel('Accept applications').selectOption('true');
  await form.getByLabel('Start date',{exact:true}).fill('2026-01-01');
  await form.getByLabel('End date',{exact:true}).fill('2026-04-01');
  await form.getByRole('button',{name:'Save program'}).click();
  await expect(page.locator('#nc-message')).toContainText('Saved successfully');
  await page.goto('/internships/public-browser-marketing');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Public Browser Marketing Program');
  await page.locator('[data-form=application]').getByLabel(/^Email/).fill('applicant-browser@example.test');
  await page.getByLabel('Full name').fill('Browser Applicant');
  await page.getByLabel('College name').fill('Example Business School');
  await page.getByLabel('Why this internship?').fill('Develop marketing research skills.');
  await page.getByRole('button',{name:'Apply for internship'}).click();
  await expect(page.locator('#nc-message')).toContainText('application has been received');
  await page.goto('/admin/applications');
  await page.getByText(/Browser Applicant · Public Browser Marketing Program/).click();
  await page.getByLabel('Decision').selectOption('ACCEPTED');
  await page.getByRole('button',{name:'Save decision'}).click();
  await expect(page.locator('#nc-message')).toContainText('Private invitation');
  await page.locator('#nc-message').getByRole('link',{name:'Open intern'}).click();
  await page.getByRole('button',{name:'Approve intern',exact:true}).click();
  await page.getByRole('button',{name:'Issue offer letter',exact:true}).click();
  await expect(page.locator('.nc-document').first()).toContainText('NC-OFFER-');
  const offerVerify=await page.locator('.nc-document').first().getByRole('link',{name:'Verify',exact:true}).getAttribute('href');
  const internURL=page.url();
  await page.getByRole('button',{name:'Activate internship',exact:true}).click();
  await page.getByRole('button',{name:'Mark completed',exact:true}).click();
  await page.getByRole('button',{name:'Approve certificate',exact:true}).click();
  await page.getByRole('button',{name:'Issue certificate',exact:true}).click();
  const download=page.waitForEvent('download');
  await page.locator('.nc-document').last().getByRole('link',{name:'Download PDF'}).click();
  expect((await download).suggestedFilename()).toContain('Internship-Certificate-Browser-Applicant');
  await page.screenshot({path:'tmp/admin-intern-new.png',fullPage:true});
  await page.goto(offerVerify);
  await expect(page.locator('.nc-status')).toContainText('VERIFIED');
  await expect(page.locator('#nc-verification')).toContainText('Browser Applicant');
  await expect(page.locator('#nc-verification')).not.toContainText('applicant-browser@example.test');
  await page.getByLabel('Offer Letter ID').fill('INVALID');
  await page.getByRole('button',{name:'Verify offer letter'}).click();
  await expect(page.locator('.nc-status')).toContainText('OFFER LETTER NOT FOUND');
  for(const width of [375,768]) {
    await page.setViewportSize({width,height:900});await page.goto(internURL);
    await expect(page.getByRole('heading',{level:1})).toHaveText('Browser Applicant');
    expect(await page.locator('.nc-portal').evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(false);
    await page.screenshot({path:`tmp/admin-new-${width}.png`,fullPage:true});
  }
});

test('templates preview, save and activate; asset API exposes metadata only',async({page})=>{
  await login(page);
  await page.getByRole('link',{name:'Templates',exact:true}).click();
  await page.getByLabel('Template name',{exact:true}).fill('Browser Certificate');
  await page.getByRole('button',{name:'Create template'}).click();
  await expect(page.locator('#nc-message')).toContainText('Saved successfully');
  await page.getByText('Browser Certificate · CERTIFICATE · INACTIVE · Draft 1',{exact:true}).click();
  const form=page.locator('[data-admin-form="template"]');
  await form.getByRole('button',{name:'Live preview'}).click();
  await expect(form.locator('iframe')).toHaveAttribute('src',/^blob:/);
  await page.screenshot({path:'tmp/admin-template-preview.png',fullPage:true});
  await form.getByLabel('Footer',{exact:true}).fill('Verified by {{company_name}}');
  await form.getByRole('button',{name:'Save draft'}).click();
  await page.getByText('Browser Certificate · CERTIFICATE · INACTIVE · Draft 2',{exact:true}).click();
  await page.getByRole('button',{name:'activate',exact:true}).click();
  await expect(page.getByText('Browser Certificate · CERTIFICATE · ACTIVE · Draft 3',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Company Assets',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Company identity & assets');
  const body=await (await page.request.get('/api/admin/company-assets')).json();
  expect(JSON.stringify(body)).not.toContain('png_base64');
  expect(JSON.stringify(body)).not.toContain('signature_png');
  await page.getByRole('link',{name:'Audit Logs',exact:true}).click();
  await expect(page.locator('.nc-table')).toContainText('TEMPLATE_UPDATED');
});

test('bootstrap login requires password rotation before dashboard access',async({page})=>{
  await login(page,'bootstrap-ui@example.test');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Change your temporary password.');
  expect((await page.request.get('/api/admin/dashboard')).status()).toBe(403);
  await page.getByLabel(/^Current password/).fill(password);
  await page.getByLabel(/^New password/).fill('Rotated-browser-test-password!');
  await page.getByRole('button',{name:'Update password'}).click();
  await expect(page.locator('#nc-message')).toContainText('Password changed');
  await page.getByLabel('Company-registered email').fill('bootstrap-ui@example.test');
  await page.getByLabel(/^Password/).fill('Rotated-browser-test-password!');
  await page.getByRole('button',{name:'Sign in',exact:false}).click();
  await expect(page.getByRole('heading',{name:'A clear view of every internship.'})).toBeVisible();
  await page.getByRole('button',{name:'Logout',exact:true}).click();
  expect((await page.request.get('/api/admin/dashboard')).status()).toBe(401);
});
