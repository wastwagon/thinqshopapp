import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
    test('home page loads and shows main content', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/ThinQShop|ThinQShopping/i);
        const main = page.locator('#main-content').or(page.locator('main'));
        await expect(main.first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('link', { name: /shop all products/i })).toBeVisible({ timeout: 15_000 });
    });

    test('shop page loads', async ({ page }) => {
        await page.goto('/shop');
        await expect(page).toHaveTitle(/Shop|ThinQShop/i);
        const main = page.locator('#main-content').or(page.locator('main'));
        await expect(main.first()).toBeVisible({ timeout: 15_000 });
    });

    test('skip link moves focus to main content', async ({ page }) => {
        await page.goto('/');
        await page.keyboard.press('Tab');
        const skipLink = page.getByRole('link', { name: /skip to main content/i });
        await expect(skipLink).toBeFocused();
        await skipLink.click();
        await expect(page.locator('#main-content')).toBeVisible();
    });
});
