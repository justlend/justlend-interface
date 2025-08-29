// @ts-check
const { defineConfig, devices } = require('@playwright/test');
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  timeout: 60 * 1000,
  testDir: './tests',
  // snapshotPathTemplate:  '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium default',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'chromium 1300',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     viewport: { width: 1300, height: 768 },
    //   },
    // },

    // {
    //   name: 'chromium 1920',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     viewport: { width: 1920, height: 1080 },
    //   },
    // },

    /* Test against mobile viewports. */
    {
      name: 'iphone width 375',
      use: { ...devices['iPhone 13 Mini'], isMobile: true},
    },

    // {
    //   name: 'iphone width 390',
    //   use: { ...devices['iPhone 14']},
    // },

    // {
    //   name: 'iphone width 430',
    //   use: { ...devices['iPhone 14 Pro Max']},
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `export NODE_OPTIONS=--openssl-legacy-provider && npm run start`,
    timeout: 1200 * 1000,
    url: 'http://localhost:18113',
    reuseExistingServer: !process.env.CI,
  },
});

