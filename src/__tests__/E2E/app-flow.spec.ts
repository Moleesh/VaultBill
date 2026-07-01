/** @format */

import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const desktopBridgeScriptPath = fileURLToPath(
    new URL('./installDesktopBridge.runtime.js', import.meta.url),
);
const desktopRecordsStorageKey = '__vaultbill_e2e_desktop_records__';
const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'wide', width: 1920, height: 1080 },
] as const;

test.beforeEach(async ({ page }) => {
    await page.addInitScript({ path: desktopBridgeScriptPath });
    await page.goto('login');
});

const loginAsAdmin = async (page: Page) => {
    const startDemoButton = page.getByRole('button', { name: /Start demo/u });
    const operatorAccountButton = page.getByRole('button', { name: /Operator account/u });
    const loginPath = await Promise.any([
        startDemoButton.waitFor({ state: 'visible' }).then(() => 'demo' as const),
        operatorAccountButton.waitFor({ state: 'visible' }).then(() => 'operator' as const),
    ]);

    if (loginPath === 'demo') {
        await startDemoButton.click();
        return;
    }

    await operatorAccountButton.click();
    await page.getByRole('option', { name: /Operations Admin/u }).click();
    const passwordField = page.getByLabel(/Password/u);
    if (await passwordField.isVisible().catch(() => false)) {
        await passwordField.fill('vaultbill-e2e-password');
    }
    await page.getByRole('button', { name: /Log in/u }).click();
};

test('operator can log in, create records, and open contextual help', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: /Records/u }).click();
    await expect(page.getByRole('heading', { name: /Create GST Invoice/u })).toBeVisible();
    await page.keyboard.press('F1');
    await expect(page.getByRole('dialog', { name: 'records help' })).toBeVisible();
    await expect(
        page.getByRole('heading', { name: /Create and finish a document/u }),
    ).toBeVisible();
});

test('Admin direct Builder URL is redirected to Records', async ({ page }) => {
    await loginAsAdmin(page);
    await page.evaluate(() => {
        const currentPath = window.location.pathname;
        const appPathIndex = currentPath.indexOf('/app/');
        const basePath = appPathIndex >= 0 ? currentPath.slice(0, appPathIndex) : '';
        window.history.pushState({}, '', `${basePath}/app/builder`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.getByRole('heading', { name: /Create GST Invoice/u })).toBeVisible();
});

test('mobile help opens as a full-screen sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdmin(page);
    await page.getByRole('link', { name: /Records/u }).click();
    await page.keyboard.press('F1');
    const helpDialog = page.getByRole('dialog', { name: 'records help' });
    await expect(helpDialog).toBeVisible();
    await expect(helpDialog).toHaveClass(/app-sheet/u);
});

test('desktop bridge saves and reloads a draft between refreshes', async ({ page }) => {
    const customerName = `Playwright ${Date.now().toString()}`;
    await loginAsAdmin(page);
    await page.getByRole('link', { name: /Records/u }).click();
    await page.getByPlaceholder('Business or customer name').fill(customerName);
    await page.getByRole('button', { name: /^Draft(?: Control\+S)?$/u }).click();
    await expect(page.getByText(/Draft saved/u)).toBeVisible();
    await expect
        .poll(() =>
            page.evaluate(
                (storageKey) => window.localStorage.getItem(storageKey) ?? '[]',
                desktopRecordsStorageKey,
            ),
        )
        .toContain(customerName);
    await page.reload();
    await loginAsAdmin(page);
    await expect
        .poll(() =>
            page.evaluate(
                (storageKey) => window.localStorage.getItem(storageKey) ?? '[]',
                desktopRecordsStorageKey,
            ),
        )
        .toContain(customerName);
});

for (const viewport of viewports) {
    test(`${viewport.name} layout has no page overflow`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Records/u }).click();
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
            ),
        ).toBe(false);
        await expect(page.getByRole('region', { name: 'Record actions' })).toBeVisible();
    });
}
