import { test, expect } from '@playwright/test';

// v2.2.0 release smoke checks: route-level rendering + per-page document.title.
// These tests intentionally avoid wallet-connected flows so they remain stable
// in CI without TronLink. They run with ?lang=en-US so text assertions are
// locale-independent of the user's browser default.

const goto = async (page, path) => {
  const url = path.includes('?') ? `${path}&lang=en-US` : `${path}?lang=en-US`;
  await page.goto(url);
};

test.describe('v2.2.0 route smoke', () => {
  test('root redirects to /homeNew (Dashboard V2)', async ({ page }) => {
    await goto(page, '/');
    await expect(page).toHaveURL(/\/homeNew(\?|$)/);
    await expect(page).toHaveTitle(/SBM V2- JustLend DAO/);
    await expect(page.locator('#root')).toBeAttached();
  });

  test('Dashboard V2 renders hero banner and Switch to V1 link', async ({ page }) => {
    await goto(page, '/homeNew');
    await expect(page).toHaveTitle(/SBM V2- JustLend DAO/);
    // Hero block from DashboardPage.jsx (intl jlv2.extra.sbmv2 / switch_to_v1).
    await expect(page.locator('.dashboard-banner .bs-title-text')).toHaveText(/Supply & Borrow/i);
    await expect(page.locator('.dashboard-banner .exchange-btn')).toContainText(/Switch to SBM V1/i);
  });

  test('homeNew alias /home renders Dashboard V2', async ({ page }) => {
    await goto(page, '/home');
    await expect(page).toHaveTitle(/SBM V2- JustLend DAO/);
    await expect(page.locator('.jlv2-bg.home-bg')).toBeAttached();
  });

  test('homeV1 renders V1 home (kept working alongside V2)', async ({ page }) => {
    await goto(page, '/homeV1');
    await expect(page).toHaveTitle(/SBM V1 - JustLend DAO/);
    await expect(page.locator('#root')).toBeAttached();
  });

  test('Vault V2 page sets its title', async ({ page }) => {
    await goto(page, '/vault');
    await expect(page).toHaveTitle(/Vault V2- JustLend DAO/);
    await expect(page.locator('#root')).toBeAttached();
  });

  test('Market V2 page sets its title', async ({ page }) => {
    await goto(page, '/marketV2');
    await expect(page).toHaveTitle(/Market V2- JustLend DAO/);
    await expect(page.locator('#root')).toBeAttached();
  });

  test('Liquidation V2 page renders', async ({ page }) => {
    await goto(page, '/liquidationV2');
    await expect(page.locator('#root')).toBeAttached();
    // LiquidationPage doesn't override document.title, so just confirm the
    // V2 surface mounted by waiting for its scoped wrapper class.
    await expect(page.locator('.jlv2-bg')).toBeAttached();
  });

  test('unknown route redirects to /homeNew', async ({ page }) => {
    await goto(page, '/this-does-not-exist');
    await expect(page).toHaveURL(/\/homeNew(\?|$)/);
    await expect(page).toHaveTitle(/SBM V2- JustLend DAO/);
  });
});

test.describe('v2.2.0 dashboard mining surface', () => {
  // Empty-position users (no wallet) should land on the marketing banner with
  // the Connect Wallet CTA; the rewards panel must NOT render in that state.
  // This guards the v2.2.0 change that gates the banner on mining-data load
  // (commits c9337ca5c, 38a433583).
  test('disconnected dashboard shows Connect Wallet CTA, not rewards panel', async ({ page }) => {
    await goto(page, '/homeNew');
    await expect(page.locator('.my-position-banner .banner-btn')).toContainText(/Connect Wallet/i);
    await expect(page.locator('.mining-rewards-card')).toHaveCount(0);
  });
});
