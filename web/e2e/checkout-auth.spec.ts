import { test, expect } from '@playwright/test';

test.describe('Checkout auth', () => {
    test('guests are sent to login', async ({ page }) => {
        await page.goto('/checkout');
        await expect(page).toHaveURL(/\/login/);
        expect(page.url()).toContain('from=%2Fcheckout');
    });
});
