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
  });
  await page.reload();
});

test('SysAdmin can log in, navigate, and open contextual help', async ({ page }) => {
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: /Welcome back/u })).toBeVisible();
  await page.getByRole('link', { name: /Records/u }).click();
  await expect(page.getByRole('heading', { name: /Documents that move/u })).toBeVisible();
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('dialog', { name: 'records help' })).toBeVisible();
  await expect(page.getByText(/Save Draft or Finalize/u)).toBeVisible();
});

test('Admin is blocked from Builder', async ({ page }) => {
  await page.getByRole('button', { name: /Operator account/u }).click();
  await page.getByRole('option', { name: /Operations Admin/u }).click();
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.goto(page.url().replace(/\/app\/[^/?]+(?:\?.*)?$/u, '/app/builder'));
  await expect(page.getByRole('heading', { name: /not available/u })).toBeVisible();
});

test('mobile help opens as a full-screen sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.getByRole('button', { name: 'Help' }).click();

  const helpDialog = page.getByRole('dialog', { name: 'dashboard help' });
  await expect(helpDialog).toBeVisible();
  await expect(helpDialog).toHaveClass(/app-sheet/u);
});

test('demo web saves and reloads a draft in browser storage', async ({ page }) => {
  test.skip(process.env.VITE_DEMO_MODE !== 'true', 'Demo mode configuration is required.');

  const customerName = `Playwright ${Date.now().toString()}`;
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.getByRole('link', { name: /Records/u }).click();
  await page.getByPlaceholder('Business or customer name').fill(customerName);
  await page.getByRole('button', { name: /Save draft/u }).click();
  await expect(page.getByText('Draft saved to browser storage.')).toBeVisible();

  const storedRecordsJson = await page.evaluate<string>(
    () => window.localStorage.getItem('vaultbill.demo.records') ?? '[]',
  );
  expect(storedRecordsJson).toContain(customerName);
  expect(storedRecordsJson).toContain('"status":"Draft"');

  await page.getByRole('button', { name: 'Drafts' }).click();
  await page.reload();
  await expect(page.getByText(customerName)).toBeVisible({ timeout: 15_000 });
});

for (const viewport of viewports) {
  test(`${viewport.name} layout has no page overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.getByRole('link', { name: /Records/u }).click();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
    await expect(page.getByRole('region', { name: 'Record actions' })).toBeVisible();
  });
}
