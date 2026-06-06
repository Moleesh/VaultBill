import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
] as const;

test.beforeEach(async ({ page }) => {
  await page.goto('login');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('vaultbill.setup.complete', 'true');
    window.localStorage.setItem(
      'vaultbill.accounts',
      JSON.stringify([
        {
          userId: 'sysadmin_1',
          username: 'sysadmin',
          displayName: 'System Administrator',
          role: 'SysAdmin',
          isActive: true,
        },
        {
          userId: 'admin_1',
          username: 'admin',
          displayName: 'Operations Admin',
          role: 'Admin',
          isActive: true,
        },
      ]),
    );
  });
  await page.reload();
  await page.goto('login');
});

test('operator can log in, create records, and open contextual help', async ({ page }) => {
  await page.getByRole('button', { name: /Log in|Start demo/u }).click();
  await page.getByRole('link', { name: /Records/u }).click();
  await expect(page.getByRole('heading', { name: /Create GST Invoice/u })).toBeVisible();
  await page.getByRole('banner').getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('dialog', { name: 'records help' })).toBeVisible();
  await expect(page.getByText(/Save Draft or Finalize/u)).toBeVisible();
});

test('Admin direct Builder URL is redirected to Records', async ({ page }) => {
  test.skip(process.env.VITE_DEMO_MODE === 'true', 'Demo has one fixed User account.');
  await page.getByRole('button', { name: /Operator account/u }).click();
  await page.getByRole('option', { name: /Operations Admin/u }).click();
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.goto(page.url().replace(/\/app\/[^/?]+(?:\?.*)?$/u, '/app/builder'));
  await expect(page.getByRole('heading', { name: /Create GST Invoice/u })).toBeVisible();
});

test('mobile help opens as a full-screen sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /Log in|Start demo/u }).click();
  await page.getByRole('link', { name: /Records/u }).click();
  await page
    .getByRole('navigation', { name: 'Mobile primary' })
    .getByRole('button', { name: 'Help' })
    .click();

  const helpDialog = page.getByRole('dialog', { name: 'records help' });
  await expect(helpDialog).toBeVisible();
  await expect(helpDialog).toHaveClass(/app-sheet/u);
});

test('demo web saves and reloads a draft in browser storage', async ({ page }) => {
  test.skip(process.env.VITE_DEMO_MODE !== 'true', 'Demo mode configuration is required.');

  const customerName = `Playwright ${Date.now().toString()}`;
  await page.getByRole('button', { name: 'Start demo' }).click();
  await page.getByPlaceholder('Business or customer name').fill(customerName);
  await page.getByRole('button', { name: /^Draft Control\+S$/u }).click();
  await expect(page.getByText(/Draft saved/u)).toBeVisible();

  const storedRecordsJson = await page.evaluate<string>(
    () => window.localStorage.getItem('vaultbill.records.v23') ?? '[]',
  );
  expect(storedRecordsJson).toContain(customerName);
  expect(storedRecordsJson).toContain('"status":"Draft"');

  await page.reload();
  const reloadedRecordsJson = await page.evaluate<string>(
    () => window.localStorage.getItem('vaultbill.records.v23') ?? '[]',
  );
  expect(reloadedRecordsJson).toContain(customerName);
});

for (const viewport of viewports) {
  test(`${viewport.name} layout has no page overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.getByRole('button', { name: /Log in|Start demo/u }).click();
    await page.getByRole('link', { name: /Records/u }).click();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
    await expect(page.getByRole('region', { name: 'Record actions' })).toBeVisible();
  });
}
