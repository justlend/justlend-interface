import { test, expect } from '@playwright/test';

test('homepage loads and title mentions JustLend DAO', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/JustLend DAO/);
  await expect(page.locator('#root')).toBeAttached();
});
