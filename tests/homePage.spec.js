const fs = require('fs-extra');
const { test, expect, devices } = require('@playwright/test');
const markets = require('../fixtures/markets.json');
const { toBigNumber, toFixedDown } = require('../fixtures/tools');
const auth = JSON.parse(fs.readFileSync('auth.json'));

// use auth storage for test
test.use({ storageState: 'auth.json' });
const pageRequestLoadTimeout = 5000;

// test.use({ ...devices['iPhone 14'], isMobile: true}); // for ui mobile debug

// playwright base steps on home page
test.describe('playwright base steps on home page', () => {
  test(`visit home page and perform some simple operations `, async ({ page }) => {
    // Listen for all console events and handle errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`Error text: "${msg.text()}"`);
    });
    // Mock the api call before navigating
    await page.route('https://apitest.justlend.org/justlend/markets', async route => {
      const json = markets;
      await route.fulfill({ json });
    });
    // Go to the page
    await page.goto('http://localhost:18113?lang=en-US', { waitUntil: 'load', timeout: 100000 });
    // assert request result is single token
    // await expect(page.locator('div.token-names').or(page.locator('span.mc-symbol.color-primary')).first()).toHaveText([
    //   'TRX'
    // ]);

    /**
     * read lang field from localStorage
     * some clicks:
     * - click connect wallet button: show connect modal
     * - click close icon: hide connect modal
     * - click supply button: show connect modal(not connected)
     * - click language selector & select zh-TC: language changed to Traditional Chinese
     * - click energe rental link(TC copywrite): jump to the energy rental page
     * - put the numbers in the energy quantities & click 'Connect wallet to rent Energy' button: show connect modal
     */
    let currentLanguage = await page.evaluate(() => localStorage.getItem('lang'));
    // TODO: use storageState is not effective(line 7)
    await expect(currentLanguage).toEqual('en-US');
    await expect(auth.origins[0].localStorage[0].value).toEqual('zh-TC');

    // await page.locator('.connect-wallet-v2').click();
    // await expect(page.getByLabel('Connect Wallet')).toBeVisible();

    // await page.getByLabel('Close', { exact: true }).click();
    // await expect(page.locator('.ant-modal')).not.toBeVisible();

    // await page.getByRole('button', { name: 'Supply' }).first().click();
    // await expect(page.getByLabel('Connect Wallet')).toBeVisible();

    // await page.getByLabel('Close', { exact: true }).click();
    // await expect(page.locator('.ant-modal')).not.toBeVisible({ timeout: 100000 });

    // take homePage UI snapshot, auto diff
    // await expect(page).toHaveScreenshot('homePage.png', { fullPage: true });

    // await page.getByText('English').click();
    

    
    

    // currentLanguage = await page.evaluate(() => localStorage.getItem('lang'))
    // await expect(currentLanguage).toEqual('zh-TC')
  });
});

// important operations on home page
// test.describe('important operations on home page', () => {
//   // connect tronweb first
//   test.beforeEach(async ({ page }) => {
//     // Listen for all console events and handle errors
//     page.on('console', msg => {
//       if (msg.type() === 'error') console.log(`Error text: "${msg.text()}"`);
//     });
//     // Init tronweb with test address
//     const privateKey = 'f51dd12e73a409b0b8d2ab74c5b56edfcca3bbcd4cb24aea6ff69ae2c1eaabd4';
//     const fullHost = 'https://api.nileex.io';
//     const params = { fullHost, privateKey };
//     // Inject tronweb param to page window
//     await page.addInitScript(params => {
//       window.playWrightTronWebParam = params;
//     }, params);
//     // Go to the page
//     await page.goto('http://localhost:18113?lang=en-US', { waitUntil: 'load', timeout: 100000 });
//     // Click supply button before connect wallet and show login modal
//     await page.getByRole('button', { name: 'Supply' }).first().click();
//     await expect(page.getByLabel('Connect Wallet')).toBeVisible();
//     // Connect wallet
//     await page
//       .locator('div')
//       .filter({ hasText: /^TronLink$/ })
//       .click();
//     await expect(page.getByLabel('Connect Wallet')).not.toBeVisible();
//   });

//   /**
//    * Supply:
//    * Click supply button and show supply modal
//    * Take snapshot of supply modal
//    * Record position before user supply
//    * Input supply number and submit supply
//    * Show the transaction modal
//    * Close transaction modal
//    * Verify position after user supply
//    */
//   test(`supply token`, async ({ page, request }, testInfo) => {
//     await page.waitForTimeout(pageRequestLoadTimeout);
//     await page.getByRole('button', { name: 'Supply' }).first().click();
//     await expect(page.locator('#rc-tabs-0-panel-1 > div')).toBeVisible();
//     const projectsName = testInfo.project.use;
//     if (projectsName.isMobile) {
//       await page.mouse.move(0, 200);
//       await expect(page.locator('.ant-modal')).toBeVisible();
//     } else {
//       await expect(
//         page
//           .locator('.j-supply-list div.sub-desc')
//           .filter({ hasText: /TRX/ })
//           .first()
//           .or(page.locator('div.safe-input.safe-input-with-wallet input'))
//           .first()
//       ).toBeVisible();
//     }
//     await expect(page.locator('.ant-modal input')).toBeVisible({ timeout: 1000000 });

//     // The zIndex level of mask is higher than that of the pop-up element, so maskColor is set to "transparent"
//     await expect(page).toHaveScreenshot('homePageSupplyModal.png', {
//       mask: [page.locator('.j-header'), page.locator('.j-container'), page.locator('.j-footer')],
//       maskColor: 'transparent'
//     });
//     const beforeText = await page
//       .locator('.j-supply-list div.sub-desc')
//       .or(page.locator('div.j-hse-position > div.sub-desc'))
//       .filter({ hasText: /TRX/ })
//       .first()
//       .textContent();
//     const beforePosition = beforeText.split(' TRX')[0].replace(/,/g, '');

//     await page.locator('#rc-tabs-0-panel-1 span.ant-input-affix-wrapper > input').fill('20');
//     await page.locator('#rc-tabs-0-panel-1 > div > button').first().click();
//     if (!projectsName.isMobile) await expect(page.locator('.j-transaction-modal')).toBeVisible();

//     await page.locator('.j-transaction-modal button.loading-close').click();
//     await expect(page.locator('.j-transaction-modal')).not.toBeVisible();

//     const expectPosition = toBigNumber(beforePosition).plus(20).toString();
//     await expect(expectPosition).toBeTruthy();
//     /**
//      * Request data for verify
//      * Can only be passed when launching UI commands locally
//      */
//     // const ADDR = 'TKGRE6oiU3rEzasue4MsB6sCXXSTx9BAe3';
//     // const JTOKEN_ADDRESS = 'TKM7w4qFmkXQLEF2MgrQroBYpd5TY7i1pq';
//     // const responsePromise = await request.get(`https://apitest.justlend.org/justlend/account?addr=${ADDR}&ver=v2&config=${JTOKEN_ADDRESS}`);
//     // const responseText = await responsePromise.text();
//     // const resultParse = JSON.parse(responseText);
//     // const { account_depositJtoken, exchangeRate } = resultParse.data.assetList[0];
//     // const afterPosition = toFixedDown(toBigNumber(account_depositJtoken).times(exchangeRate).div(1e18).div(1e6), 3);
//     // await expect(afterPosition).toEqual(expectPosition);

//     await page.waitForTimeout(10000); // Waiting for on-chain data synchronization
//     await expect(page.getByText('Completed')).toBeVisible();
//     const afterText = await page
//       .locator('.j-supply-list div.sub-desc')
//       .or(page.locator('div.j-hse-position > div.sub-desc'))
//       .filter({ hasText: /TRX/ })
//       .first()
//       .textContent();
//     const afterPosition = toBigNumber(afterText.split(' TRX')[0]).toString();
//     await expect(afterPosition).toBeTruthy();
//     /**
//      * Can only be passed when launching UI commands locally
//      */
//     // await expect(afterPosition).toEqual(expectPosition);
//   });

//   /**
//    * Borrow:
//    * Click borrow button and show borrow modal
//    * Take snapshot of borrow modal
//    * Record position before user borrow
//    * Input borrow number and submit borrow
//    * Show the transaction modal
//    * Close transaction modal
//    * Verify position after user borrow
//    */
//   test(`borrow token`, async ({ page }, testInfo) => {
//     await page.waitForTimeout(pageRequestLoadTimeout);
//     const projectsName = testInfo.project.use;
//     if (projectsName.isMobile) {
//       await page.mouse.move(0, 200);
//       await page.locator('div.j-home-user-list-tabs > div:nth-child(3)').click();
//       await page
//         .locator('div.market-cards button')
//         .filter({ hasText: /Borrow/ })
//         .first()
//         .click();
//     } else {
//       await page.getByRole('button', { name: 'Borrow' }).first().click();
//     }
//     if (projectsName.isMobile) {
//       await expect(page.locator('.ant-modal')).toBeVisible();
//     } else {
//       await expect(
//         page
//           .locator('.j-borrow-list div.sub-desc')
//           .filter({ hasText: /TRX/ })
//           .first()
//           .or(page.locator('div.safe-input.safe-input-with-wallet input'))
//           .first()
//       ).toBeVisible();
//     }
//     await expect(page.locator('.ant-modal input')).toBeVisible({ timeout: 1000000 });

//     if (!projectsName.isMobile) {
//       await expect(page).toHaveScreenshot('homePageBorrowModal.png', {
//         mask: [page.locator('.j-header'), page.locator('.j-container'), page.locator('.j-footer')],
//         maskColor: 'transparent'
//       });
//     }
//     const beforeText = await page
//       .locator('.j-borrow-list div.sub-desc')
//       .or(page.locator('div.j-hse-position > div.sub-desc'))
//       .filter({ hasText: /TRX/ })
//       .first()
//       .textContent();
//     const beforePosition = beforeText.split(' TRX')[0].replace(/,/g, '');

//     await page.locator('.ant-modal.j-borrow-modal input').fill('10');
//     await page.locator('.ant-modal.j-borrow-modal button.j-borrow').first().click();
//     await expect(page.locator('.ant-modal')).toBeVisible({ timeout: 100000 });

//     await page.locator('.j-transaction-modal button.loading-close').click();
//     await expect(page.locator('.j-transaction-modal')).not.toBeVisible();

//     await page.waitForTimeout(10000); // Waiting for on-chain data synchronization
//     await expect(page.getByText('Completed')).toBeVisible();
//     const expectPosition = toBigNumber(beforePosition).plus(10).toString();
//     await expect(expectPosition).toBeTruthy();
//     const afterText = await page
//       .locator('.j-borrow-list div.sub-desc')
//       .or(page.locator('div.j-hse-position > div.sub-desc'))
//       .filter({ hasText: /TRX/ })
//       .first()
//       .textContent();
//     const afterPosition = toBigNumber(afterText.split(' TRX')[0]).toString();
//     await expect(afterPosition).toBeTruthy();
//     /**
//      * Can only be passed when launching UI commands locally
//      */
//     // await expect(afterPosition).toEqual(expectPosition);
//   });

//   /**
//    * Withdraw:
//    * Click withdraw button and show withdraw modal
//    * Click withdraw tab
//    * Take snapshot of withdraw modal
//    * Record position before user withdraw
//    * Input withdraw number and submit withdraw
//    * Show the transaction modal
//    * Close transaction modal
//    * Verify position after user withdraw
//    */
//   test(`withdraw token`, async ({ page }, testInfo) => {
//     await page.waitForTimeout(pageRequestLoadTimeout);
//     await page.getByRole('button', { name: 'Supply' }).first().click();
//     await expect(page.locator('.ant-modal.j-daw-modal')).toBeVisible();
//     const projectsName = testInfo.project.use;
//     if (projectsName.isMobile) {
//       await expect(page.locator('.ant-modal')).toBeVisible();
//     } else {
//       await expect(
//         page
//           .locator('.j-supply-list div.sub-desc')
//           .filter({ hasText: /TRX/ })
//           .first()
//           .or(page.locator('div.safe-input.safe-input-with-wallet input'))
//           .first()
//       ).toBeVisible();
//     }
//     await expect(page.locator('.ant-modal input')).toBeVisible({ timeout: 1000000 });

//     await page.getByRole('tab', { name: 'Withdraw' }).click();
//     await expect(
//       page.locator('.ant-modal.j-daw-modal span.ant-input-affix-wrapper.ant-input-affix-wrapper-sm')
//     ).toBeVisible();

//     await expect(page).toHaveScreenshot('homePageWithdrawModal.png', {
//       mask: [page.locator('.j-header'), page.locator('.j-container'), page.locator('.j-footer')],
//       maskColor: 'transparent'
//     });
//     const beforeText = await page
//       .locator('.j-supply-list div.sub-desc')
//       .or(page.locator('div.j-hse-position > div.sub-desc'))
//       .filter({ hasText: /TRX/ })
//       .first()
//       .textContent();
//     const beforePosition = beforeText.split(' TRX')[0].replace(/,/g, '');

//     await page.locator('.ant-modal.j-daw-modal span.ant-input-affix-wrapper input.ant-input-sm').fill('20');
//     await page.locator('.ant-modal.j-daw-modal button.j-withdraw').first().click();
//     if (!projectsName.isMobile) await expect(page.locator('.j-transaction-modal')).toBeVisible();

//     await page.locator('.j-transaction-modal button.loading-close').click();
//     await expect(page.locator('.j-transaction-modal')).not.toBeVisible();
//     await page.waitForTimeout(15000); // Waiting for on-chain data synchronization
//     await expect(page.getByText('Completed')).toBeVisible();
//     const expectPosition = toBigNumber(beforePosition).minus(20).toString();
//     await expect(expectPosition).toBeTruthy();
//     const afterText = await page
//       .locator('.j-supply-list div.sub-desc')
//       .or(page.locator('div.j-hse-position > div.sub-desc'))
//       .filter({ hasText: /TRX/ })
//       .first()
//       .textContent();
//     const afterPosition = toBigNumber(afterText.split(' TRX')[0]).toString();
//     await expect(afterPosition).toBeTruthy();
//     /**
//      * Can only be passed when launching UI commands locally
//      */
//     // await expect(afterPosition).toEqual(expectPosition);
//   });

//   /**
//    * Repay:
//    * Click repay button and show repay modal
//    * Click repay tab
//    * Take snapshot of repay modal
//    * Record position before user repay
//    * Input repay number and submit repay
//    * Show the transaction modal
//    * Close transaction modal
//    * Verify position after user repay
//    */
//   test(`repay token`, async ({ page }, testInfo) => {
//     await page.waitForTimeout(pageRequestLoadTimeout);
//     const projectsName = testInfo.project.use;
//     if (projectsName.isMobile) {
//       await page.mouse.move(0, 200);
//       await page.locator('div.j-home-user-list-tabs > div:nth-child(3)').click();
//       await page
//         .locator('div.market-cards button')
//         .filter({ hasText: /Borrow/ })
//         .first()
//         .click();
//     } else {
//       await page.locator('div.ant-table-wrapper tr:nth-child(2) button.j-btn.j-borrow').first().click();
//     }
//     if (projectsName.isMobile) {
//       await expect(page.locator('.ant-modal')).toBeVisible();
//     } else {
//       await expect(
//         page
//           .locator('.j-borrow-list div.sub-desc')
//           .filter({ hasText: /TRX/ })
//           .first()
//           .or(page.locator('div.safe-input.safe-input-with-wallet input'))
//           .first()
//       ).toBeVisible();
//     }
//     await expect(page.locator('.ant-modal input')).toBeVisible({ timeout: 1000000 });

//     await page
//       .getByLabel('TRX')
//       .locator('div')
//       .filter({ hasText: /^Repay$/ })
//       .first()
//       .click();
//     await expect(page.locator('span.ant-input-affix-wrapper.ant-input-affix-wrapper-sm')).toBeVisible();

//     await expect(page).toHaveScreenshot('homePageRepayModal.png', {
//       mask: [page.locator('.j-header'), page.locator('.j-container'), page.locator('.j-footer')],
//       maskColor: 'transparent'
//     });
//     const beforeText = await page
//       .locator('.j-borrow-list div.sub-desc')
//       .or(page.locator('div.j-hse-position > div.sub-desc'))
//       .filter({ hasText: /TRX/ })
//       .first()
//       .textContent();
//     const beforePosition = beforeText.split(' TRX')[0].replace(/,/g, '');

//     await page.locator('span.ant-input-affix-wrapper.ant-input-affix-wrapper-sm input').fill('10');
//     await page.locator('.j-borrow-modal button.j-repay').first().click();
//     await expect(page.locator('.ant-modal')).toBeVisible({ timeout: 100000 });

//     // await page.locator('.j-transaction-modal button.loading-close').click();
//     // await expect(page.locator('.j-transaction-modal')).not.toBeVisible();
//     await page.waitForTimeout(15000); // Waiting for on-chain data synchronization
//     const expectPosition = toBigNumber(beforePosition).minus(10).toString();
//     await expect(expectPosition).toBeTruthy();
//     const afterText = await page
//       .locator('.j-borrow-list div.sub-desc')
//       .or(page.locator('div.j-hse-position > div.sub-desc'))
//       .filter({ hasText: /TRX/ })
//       .first()
//       .textContent();
//     const afterPosition = toBigNumber(afterText.split(' TRX')[0]).toString();
//     await expect(afterPosition).toBeTruthy();
//     /**
//      * Can only be passed when launching UI commands locally
//      */
//     // await expect(afterPosition).toEqual(expectPosition);
//   });
// });
