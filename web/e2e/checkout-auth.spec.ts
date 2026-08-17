import { test, expect } from '@playwright/test';

test.describe('Checkout auth', () => {
    test('guests can open checkout without signing in', async ({ page }) => {
        await page.goto('/checkout');
        await expect(page).not.toHaveURL(/\/login/);
    });
});
