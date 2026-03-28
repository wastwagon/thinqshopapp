import { test, expect } from '@playwright/test';

/**
 * Intercept all /api/* calls so nothing hits the real backend (401 → session expired).
 */
async function installApiMocks(page: import('@playwright/test').Page) {
    await page.route('**/api/**', async (route) => {
        const url = route.request().url();
        const json = (data: unknown) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(data),
            });

        if (url.includes('/users/profile') && !url.includes('/avatar')) {
            return json({ id: 1, email: 'e2e@example.com', role: 'admin' });
        }
        if (url.includes('/invoice-rates')) {
            return json([]);
        }
        if (url.includes('/logistics/freight-rates')) {
            return json([
                {
                    id: 101,
                    rate_id: 'e2e_air_kg',
                    method: 'air_freight',
                    name: 'E2E Air KG',
                    price: 10,
                    type: 'KG',
                    duration: '5–7 days',
                    currency: 'USD',
                    is_active: true,
                },
            ]);
        }
        if (url.includes('/products/categories')) {
            return json([]);
        }
        if (url.includes('/users/admin/list')) {
            return json({ data: [] });
        }
        // Topbar polls this; a real 401 triggers axios → /login?session=expired
        if (url.includes('/notifications')) {
            return json([]);
        }
        if (url.includes('/content/settings/public')) {
            return json({});
        }
        // CartProvider fetches after login; 401 would trigger axios session redirect
        if (url.includes('/api/cart')) {
            return json([]);
        }

        return json({});
    });
}

test.describe('Shipping calculator (admin)', () => {
    test.beforeEach(async ({ page, context }) => {
        await context.addCookies([
            { name: 'thinq_session', value: 'e2e', domain: 'localhost', path: '/' },
        ]);
        await page.addInitScript(() => {
            localStorage.setItem('token', 'e2e-mock-jwt');
        });
        await installApiMocks(page);
    });

    test('freight USD quote: calculate shows native total and invoice line', async ({ page }) => {
        await page.goto('/admin/invoices/new', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/admin\/invoices\/new/);
        await expect(page.getByRole('heading', { name: /Shipping Fee Estimator/i })).toBeVisible({ timeout: 25_000 });

        await expect(page.getByTestId('invoice-currency')).toHaveValue('USD', { timeout: 15_000 });

        await page.getByTestId('calculate-btn').click();

        await expect(page.getByTestId('quote-result')).toBeVisible();
        await expect(page.getByTestId('native-total')).toContainText('USD');
        await expect(page.getByTestId('quote-result')).toContainText(/Invoice line:\s*USD\s*200/);
    });

    test('FX: GHS invoice from USD quote uses multiplier', async ({ page }) => {
        await page.goto('/admin/invoices/new');
        await expect(page.getByRole('heading', { name: /Shipping Fee Estimator/i })).toBeVisible({ timeout: 25_000 });

        await page.getByTestId('calculate-btn').click();
        await expect(page.getByTestId('quote-result')).toBeVisible();

        await page.getByTestId('invoice-currency').selectOption('GHS');
        await expect(page.getByTestId('fx-rate')).toBeVisible();

        await page.getByTestId('fx-rate').fill('15');
        await expect(page.getByTestId('quote-result')).toContainText(/Invoice line:\s*GHS\s*3000/);
    });
});
