const { test, expect, devices } = require('@playwright/test');
const { toBigNumber } = require('../fixtures/tools');

// test.use({ ...devices['iPhone 14'], isMobile: true}); // for ui mobile debug

const pageLoadTimeout = 2000;
const inputDelayTimeout = 3000;
const renewFormLoadTimeout = 7000;
const transactionLoadingTimeout = 15000;
const miniOrderListRefreshTimeout = 20000;

test.describe.configure({ mode: 'serial' });

let page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page.close();
});

// use auth storage for test
test.use({ storageState: 'auth.json' });

test.describe('basic steps in energy rental page', () => {
  test(`check rental form input and compare page ui with screenshot`, async () => {
    // Listen for all console events and handle errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`Error text: "${msg.text()}"`);
    });
    // Go to the page
    await page.goto('http://localhost:18113/energyRental?lang=en-US', { waitUntil: 'load' });
    await page.waitForTimeout(pageLoadTimeout);

    // Close first vist modal
    await page.locator('.explore-btn').click();

    // Update input value in rental form
    await page.locator('.energy-amount-input input').fill('234567');
    await page.waitForTimeout(inputDelayTimeout);
    await page.locator('.duration-input-row .duration-option').filter({ hasText: '3 Days' }).click();

    // Click action button
    await expect(page.locator('.rent-action-button')).toBeEnabled();
    await expect(page.locator('.rent-action-button')).toHaveText('Connect Wallet');
    await page.locator('.rent-action-button').click();
    await expect(page.locator('div').filter({ hasText: /^TronLink$/ })).toBeVisible();

    // Close tronlink connect modal
    await page.locator('.ant-modal-close-x').click();
    await expect(page.locator('.ant-modal')).not.toBeVisible();

    // take enegyRentalPage UI snapshot, auto diff
    // await expect(page).toHaveScreenshot('energyRentalPage.png', { fullPage: true }); // Price changes lead to frequent snapshot changes
  });
});

// test.describe('rental operations for others', () => {
//   test.beforeEach(async () => {
//     // Listen for all console events and handle errors
//     page.on('console', msg => { if (msg.type() === 'error') console.log(`Error text: "${msg.text()}"`) });

//     // Init tronweb with test address
//     const privateKey = '60d2310ec738ee856f9bf8c53492e29a04856757ca15883c0c54dede156c8ac5';
//     const fullHost = 'https://api.nileex.io';
//     const params = { fullHost, privateKey };
//     // Inject tronweb param to page window
//     await page.addInitScript(params => { window.playWrightTronWebParam = params }, params);
//     // Go to the page
//     await page.goto('http://localhost:18113/energyRental?lang=en-US', { waitUntil: 'load', timeout: 100000 });
//     // Click action button to connect wallet
//     await expect(page.locator('.rent-action-button')).toBeEnabled();
//     await expect(page.locator('.rent-action-button')).toHaveText('Connect Wallet');
//     await page.locator('.rent-action-button').click();
//     await expect(page.locator('div').filter({ hasText: /^TronLink$/ })).toBeVisible();
//     // Connect wallet
//     await page.locator('div').filter({ hasText: /^TronLink$/ }).click();
//     await expect(page.getByLabel('Connect Wallet')).not.toBeVisible();
//   });

// 1) Create rental order for others
// 2) Add rental amount for others
// 3) Add rental duration for others
// 4) End rental for others
// test(`create rental order for others`, async ({}, testInfo) => {
//   const projectsName = testInfo.project.use;

//   if (!projectsName.isMobile) {
//     await page.waitForTimeout(pageLoadTimeout);

//     // 1) Create rental order for others
//     // Rent for others form input
//     await page.locator('.energy-amount-input input').fill('200000');
//     await page.waitForTimeout(inputDelayTimeout);
//     await page.locator('.duration-input-row .duration-option').filter({ hasText: '1 Day' }).click();
//     await page.waitForTimeout(inputDelayTimeout);
//     await page.locator('.other-address-field-title .title-text').click();
//     await page.waitForTimeout(inputDelayTimeout);
//     await expect(page.locator('.other-address-input input')).toBeEnabled();
//     await page.locator('.other-address-input input').fill('TT2AFKsqAq1JgNKBCJTc4VDGdUsnVamYsr');
//     await page.waitForTimeout(inputDelayTimeout);

//     // Wait for prepayment calculation then click the rent button
//     await expect(page.locator('.rent-action-button')).toBeEnabled();
//     // await expect(page).toHaveScreenshot('energyRental_others_new_rental.png', { fullPage: true });
//     await page.locator('.rent-action-button').click();

//     // Wait for add order modal to appear then click the confirm button
//     // await expect(page.locator('.add-order-modal-content.confirm-detail .content-title')).toHaveText('Prepayment', { timeout: 100000 });
//     await expect(page.locator('.add-order-modal-content.confirm-detail .confirm-btn')).toBeEnabled({ timeout: 150000 });
//     await page.locator('.add-order-modal-content.confirm-detail .confirm-btn').click();

//     // Wait for transaction to complete. Check for Transaction succeed icon in add order modal
//     await page.waitForTimeout(transactionLoadingTimeout);
//     await expect(page.locator('.add-order-modal-content.confirm-detail .content-icon.succeed-icon')).toBeVisible();
//     await expect(page.locator('.add-order-modal-content.confirm-detail .close-btn')).toBeEnabled();
//     await page.locator('.add-order-modal-content.confirm-detail .close-btn').click();

//     // Wait for mini order list to refresh. Check the new rental order and verify the rental energy amount is greater than or equal to 200000
//     await page.waitForTimeout(miniOrderListRefreshTimeout);
//     await expect(page.locator('.rental-order-mini-list .rent-for-others-tips')).toBeVisible();
//     var othersOrderItem = await page.locator('.rental-order-mini-list .order-item').filter({ has: page.locator('.rent-for-others-tips') });
//     await expect(othersOrderItem.locator('.order-header')).toContainText('TT2AFK...VamYsr');
//     var rentedAmount = toBigNumber(await page.locator('.rental-order-mini-list .order-item .energy-row .value').first().textContent()).toNumber();
//     await expect(rentedAmount).toBeGreaterThanOrEqual(200000);
//   }
// });

// test(`add rental amount for others`, async ({}, testInfo) => {
//   const projectsName = testInfo.project.use;

//   if (!projectsName.isMobile) {
//     await page.waitForTimeout(pageLoadTimeout);

//     // 2) Add rental amount for others
//     // Find the rental order and verify the address. Then click the add button.
//     var othersOrderItem = await page.locator('.rental-order-mini-list .order-item').filter({ has: page.locator('.rent-for-others-tips') });
//     await expect(othersOrderItem.locator('.order-header')).toContainText('TT2AFK...VamYsr');
//     await expect(othersOrderItem.locator('.add-btn')).toBeEnabled();
//     await othersOrderItem.locator('.add-btn').click();

//     // Wait for add order modal to appear then update energy amount input
//     await page.waitForTimeout(renewFormLoadTimeout);
//     await expect(page.locator('.add-order-modal .modal-title')).toHaveText('Renew Rental');
//     await page.locator('.add-order-modal-content.renew-form .energy-amount-input input').fill('200000');

//     // Wait for prepayment calculation then click the rent button
//     await expect(page.locator('.add-order-modal-content.renew-form .confirm-btn')).toBeEnabled();
//     // await expect(page).toHaveScreenshot('energyRental_others_add_energy.png');
//     await page.locator('.add-order-modal-content.renew-form .confirm-btn').click();

//     // Verify the confirm transaction step to appear then click the confirm button
//     await expect(page.locator('.add-order-modal-content.confirm-detail .content-title')).toHaveText('Prepayment');
//     await expect(page.locator('.add-order-modal-content.confirm-detail .confirm-btn')).toBeEnabled();
//     // await expect(page).toHaveScreenshot('energyRental_others_add_energy_confirm.png');
//     await page.locator('.add-order-modal-content.confirm-detail .confirm-btn').click();

//     // Wait for transaction to complete. Check for Transaction succeed icon in add order modal
//     await page.waitForTimeout(transactionLoadingTimeout);
//     await expect(page.locator('.add-order-modal-content.confirm-detail .content-icon.succeed-icon')).toBeVisible();
//     await expect(page.locator('.add-order-modal-content.confirm-detail .close-btn')).toBeEnabled();
//     await page.locator('.add-order-modal-content.confirm-detail .close-btn').click();

//     // Wait for mini order list to refresh. Check the new rental order and verify the rental energy amount is greater than or equal to 200000
//     await page.waitForTimeout(miniOrderListRefreshTimeout);
//     await expect(page.locator('.rental-order-mini-list .rent-for-others-tips')).toBeVisible();
//     othersOrderItem = await page.locator('.rental-order-mini-list .order-item').filter({ has: page.locator('.rent-for-others-tips') });
//     await expect(othersOrderItem.locator('.order-header')).toContainText('TT2AFK...VamYsr');
//     var rentedAmount = toBigNumber(await page.locator('.rental-order-mini-list .order-item .energy-row .value').first().textContent()).toNumber();
//     await expect(rentedAmount).toBeGreaterThanOrEqual(400000);
//   }
// });

// test(`end rental for others`, async ({}, testInfo) => {
//   const projectsName = testInfo.project.use;

//   if (!projectsName.isMobile) {
//     await page.waitForTimeout(pageLoadTimeout);

//     // 4) End rental for others
//     // Find the rental order and verify the address. Then click the end rental button.
//     var othersOrderItem = await page.locator('.rental-order-mini-list .order-item').filter({ has: page.locator('.rent-for-others-tips') });
//     await expect(othersOrderItem.locator('.order-header')).toContainText('TT2AFK...VamYsr');
//     await expect(othersOrderItem.locator('.end-btn')).toBeEnabled();
//     await othersOrderItem.locator('.end-btn').click();

//     // Wait for end order modal to appear then click the confirm button
//     await expect(page.locator('.end-order-modal .content-title')).toHaveText('Refund Amount');
//     await expect(page.locator('.end-order-modal .end-btn')).toBeEnabled();
//     // await expect(page).toHaveScreenshot('energyRental_others_end_rental.png');
//     await page.locator('.end-order-modal .end-btn').click();

//     // Wait for transaction to complete. Check for the "Completed" title in the transaction modal
//     await page.waitForTimeout(transactionLoadingTimeout);
//     await expect(page.locator('.j-transaction-modal .trans-title')).toHaveText('Completed');
//     await expect(page.locator('.j-transaction-modal .loading-close')).toBeEnabled();
//     // await expect(page).toHaveScreenshot('energyRental_others_end_rental_succeed.png');
//     await page.locator('.j-transaction-modal .loading-close').click();

//     // Wait for mini order list to refresh. Check if there is no rental order for myself
//     await page.waitForTimeout(miniOrderListRefreshTimeout);
//     await expect(page.locator('.rental-order-mini-list .rent-for-others-tips')).not.toBeVisible();
//   }
// });
// })

/*
test.describe('rental operations for myself', () => {
  // connect tronweb first
  test.beforeEach(async () => {
    // Listen for all console events and handle errors
    page.on('console', msg => { if (msg.type() === 'error') console.log(`Error text: "${msg.text()}"`) });

    // Init tronweb with test address
    const privateKey = '60d2310ec738ee856f9bf8c53492e29a04856757ca15883c0c54dede156c8ac5';
    const fullHost = 'https://api.nileex.io';
    const params = { fullHost, privateKey };
    // Inject tronweb param to page window
    await page.addInitScript(params => { window.playWrightTronWebParam = params }, params);
    // Go to the page
    await page.goto('http://localhost:18113/energyRental?lang=en-US', { waitUntil: 'load', timeout: 10000 });
    // Click action button to connect wallet
    await expect(page.locator('.rent-action-button')).toBeEnabled();
    await expect(page.locator('.rent-action-button')).toHaveText('Connect Wallet');
    await page.locator('.rent-action-button').click();
    await expect(page.locator('div').filter({ hasText: /^TronLink$/ })).toBeVisible();
    // Connect wallet
    await page.locator('div').filter({ hasText: /^TronLink$/ }).click();
    await expect(page.getByLabel('Connect Wallet')).not.toBeVisible();
  });

  // Tried to end all rental orders before tests but failed to determine if there is any order
  test(`end all rental orders`, async ({ page }, testInfo) => {
    await page.waitForTimeout(pageLoadTimeout);

    // Wait until page load finish
    await expect(page.locator('.energy-amount-input')).toBeVisible();
    
    // Find the first rental order
    var firstOrderItem = await page.locator('.rental-order-mini-list .order-item').first();

    while (firstOrderItem && firstOrderItem !== null) {
      // Click the end rental button
      await expect(firstOrderItem.locator('.end-btn')).toBeEnabled();
      await firstOrderItem.locator('.end-btn').click();
      
      // Wait for end order modal to appear then click the confirm button
      await expect(page.locator('.end-order-modal .content-title')).toHaveText('Refund Amount');
      await expect(page.locator('.end-order-modal .end-btn')).toBeEnabled();
      await page.locator('.end-order-modal .end-btn').click();

      // Wait for transaction to complete. Check for the "Completed" title in the transaction modal
      await page.waitForTimeout(transactionLoadingTimeout);
      await expect(page.locator('.j-transaction-modal .trans-title')).toHaveText('Completed');
      await expect(page.locator('.j-transaction-modal .loading-close')).toBeEnabled();
      await page.locator('.j-transaction-modal .loading-close').click();

      // Wait for mini order list to refresh. Check if there is any rental order
      await page.waitForTimeout(miniOrderListRefreshTimeout);
      firstOrderItem = await page.locator('.rental-order-mini-list .order-item').first();
    }

    await expect(page.locator('.rental-order-mini-list .order-item')).not.toBeVisible();
  });

  // 1) Create rental order for myself
  // 2) Add rental amount for myself
  // 3) Add rental duration for myself
  // 4) End rental for myself
  test(`create rental order for myself`, async () => {
    await page.waitForTimeout(pageLoadTimeout);

    // 1) Create rental order for myself
    // Rent for myself form input
    await expect(page).toHaveScreenshot('testing_shot_1.png', { fullPage: true });
    await page.locator('.energy-amount-input input').fill('200000');
    await page.waitForTimeout(inputDelayTimeout);
    await expect(page).toHaveScreenshot('testing_shot_2.png', { fullPage: true });
    await page.locator('.duration-input-row .duration-option').filter({ hasText: '1 Day' }).click();
    await expect(page).toHaveScreenshot('testing_shot_3.png', { fullPage: true });

    // Wait for prepayment calculation then click the rent button
    await expect(page.locator('.rent-action-button')).toBeEnabled();
    // await expect(page).toHaveScreenshot('energyRental_self_new_rental.png', { fullPage: true });
    await page.locator('.rent-action-button').click();

    // Wait for add order modal to appear then click the confirm button
    await expect(page.locator('.add-order-modal-content.confirm-detail .content-title')).toHaveText('Prepayment');
    await expect(page.locator('.add-order-modal-content.confirm-detail .confirm-btn')).toBeEnabled();
    await page.locator('.add-order-modal-content.confirm-detail .confirm-btn').click();

    // Wait for transaction to complete. Check for Transaction succeed icon in add order modal
    await page.waitForTimeout(transactionLoadingTimeout);
    await expect(page.locator('.add-order-modal-content.confirm-detail .content-icon.succeed-icon')).toBeVisible();
    await expect(page.locator('.add-order-modal-content.confirm-detail .close-btn')).toBeEnabled();
    // await expect(page).toHaveScreenshot('energyRental_self_new_rental_succeed.png');
    await page.locator('.add-order-modal-content.confirm-detail .close-btn').click();

    // Wait for mini order list to refresh. Check the new rental order and verify the rental energy amount is greater than or equal to 200000
    await page.waitForTimeout(miniOrderListRefreshTimeout);
    await expect(page.locator('.rental-order-mini-list .rent-for-self-tips')).toBeVisible();
    var selfOrderItem = await page.locator('.rental-order-mini-list .order-item').filter({ has: page.locator('.rent-for-self-tips') });
    await expect(selfOrderItem.locator('.order-header')).toContainText('TKBD64...mhs7hB');
    var rentedAmount = toBigNumber(await page.locator('.rental-order-mini-list .order-item .energy-row .value').first().textContent()).toNumber();
    await expect(rentedAmount).toBeGreaterThanOrEqual(200000);
  });
    
  test(`add rental amount for myself`, async () => {
    await page.waitForTimeout(pageLoadTimeout);

    // 2) Add rental amount for myself
    // Find the rental order and verify the address. Then click the add button.
    var selfOrderItem = await page.locator('.rental-order-mini-list .order-item').filter({ has: page.locator('.rent-for-self-tips') });
    await expect(selfOrderItem.locator('.order-header')).toContainText('TKBD64...mhs7hB');
    await expect(selfOrderItem.locator('.add-btn')).toBeEnabled();
    await selfOrderItem.locator('.add-btn').click();

    // Wait for add order modal to appear then update energy amount input
    await page.waitForTimeout(renewFormLoadTimeout);
    await expect(page.locator('.add-order-modal .modal-title')).toHaveText('Renew Rental');
    await page.locator('.add-order-modal-content.renew-form .energy-amount-input input').fill('200000');
    
    // Wait for prepayment calculation then click the rent button
    await expect(page.locator('.add-order-modal-content.renew-form .confirm-btn')).toBeEnabled();
    // await expect(page).toHaveScreenshot('energyRental_self_add_energy.png');
    await page.locator('.add-order-modal-content.renew-form .confirm-btn').click();

    // Verify the confirm transaction step to appear then click the confirm button
    await expect(page.locator('.add-order-modal-content.confirm-detail .content-title')).toHaveText('Prepayment');
    await expect(page.locator('.add-order-modal-content.confirm-detail .confirm-btn')).toBeEnabled();
    // await expect(page).toHaveScreenshot('energyRental_self_add_energy_confirm.png');
    await page.locator('.add-order-modal-content.confirm-detail .confirm-btn').click();

    // Wait for transaction to complete. Check for Transaction succeed icon in add order modal
    await page.waitForTimeout(transactionLoadingTimeout);
    await expect(page.locator('.add-order-modal-content.confirm-detail .content-icon.succeed-icon')).toBeVisible();
    await expect(page.locator('.add-order-modal-content.confirm-detail .close-btn')).toBeEnabled();
    await page.locator('.add-order-modal-content.confirm-detail .close-btn').click();

    // Wait for mini order list to refresh. Check the new rental order and verify the rental energy amount is greater than or equal to 200000
    await page.waitForTimeout(miniOrderListRefreshTimeout);
    await expect(page.locator('.rental-order-mini-list .rent-for-self-tips')).toBeVisible();
    selfOrderItem = await page.locator('.rental-order-mini-list .order-item').filter({ has: page.locator('.rent-for-self-tips') });
    await expect(selfOrderItem.locator('.order-header')).toContainText('TKBD64...mhs7hB');
    var rentedAmount = toBigNumber(await page.locator('.rental-order-mini-list .order-item .energy-row .value').first().textContent()).toNumber();
    await expect(rentedAmount).toBeGreaterThanOrEqual(400000);
  });

  test(`add rental duration for myself`, async () => {
    await page.waitForTimeout(pageLoadTimeout);

    // 3) Add rental duration for myself
    // Find the rental order and verify the address. Then click the add button.
    var selfOrderItem = await page.locator('.rental-order-mini-list .order-item').filter({ has: page.locator('.rent-for-self-tips') });
    await expect(selfOrderItem.locator('.order-header')).toContainText('TKBD64...mhs7hB');
    await expect(selfOrderItem.locator('.add-btn')).toBeEnabled();
    await selfOrderItem.locator('.add-btn').click();

    // Wait for add order modal to appear then update duration input
    await page.waitForTimeout(renewFormLoadTimeout);
    await expect(page.locator('.add-order-modal .modal-title')).toHaveText('Renew Rental');
    await page.locator('.add-order-modal-content.renew-form .new-switch.switch-on').click();
    await page.waitForTimeout(inputDelayTimeout);
    await page.locator('.add-order-modal-content.renew-form .duration-input input').fill('1');
    
    // Wait for prepayment calculation then click the rent button
    await expect(page.locator('.add-order-modal-content.renew-form .confirm-btn')).toBeEnabled();
    // await expect(page).toHaveScreenshot('energyRental_self_add_duration.png');
    await page.locator('.add-order-modal-content.renew-form .confirm-btn').click();

    // Verify the confirm transaction step to appear then click the confirm button
    await expect(page.locator('.add-order-modal-content.confirm-detail .content-title')).toHaveText('Prepayment');
    await expect(page.locator('.add-order-modal-content.confirm-detail .confirm-btn')).toBeEnabled();
    // await expect(page).toHaveScreenshot('energyRental_self_add_duration_confirm.png');
    await page.locator('.add-order-modal-content.confirm-detail .confirm-btn').click();

    // Wait for transaction to complete. Check for Transaction succeed icon in add order modal
    await page.waitForTimeout(transactionLoadingTimeout);
    await expect(page.locator('.add-order-modal-content.confirm-detail .content-icon.succeed-icon')).toBeVisible();
    await expect(page.locator('.add-order-modal-content.confirm-detail .close-btn')).toBeEnabled();
    await page.locator('.add-order-modal-content.confirm-detail .close-btn').click();

    // Wait for mini order list to refresh. Check the new rental order and verify the rental address
    await page.waitForTimeout(miniOrderListRefreshTimeout);
    await expect(page.locator('.rental-order-mini-list .rent-for-self-tips')).toBeVisible();
    selfOrderItem = await page.locator('.rental-order-mini-list .order-item').filter({ has: page.locator('.rent-for-self-tips') });
    await expect(selfOrderItem.locator('.order-header')).toContainText('TKBD64...mhs7hB');
  });

  test(`end rental for myself`, async () => {
    await page.waitForTimeout(pageLoadTimeout);

    // 4) End rental for myself
    // Find the rental order and verify the address. Then click the end rental button.
    var selfOrderItem = await page.locator('.rental-order-mini-list .order-item').filter({ has: page.locator('.rent-for-self-tips') });
    await expect(selfOrderItem.locator('.order-header')).toContainText('TKBD64...mhs7hB');
    await expect(selfOrderItem.locator('.end-btn')).toBeEnabled();
    await selfOrderItem.locator('.end-btn').click();

    // Wait for end order modal to appear then click the confirm button
    await expect(page.locator('.end-order-modal .content-title')).toHaveText('Refund Amount');
    await expect(page.locator('.end-order-modal .end-btn')).toBeEnabled();
    // await expect(page).toHaveScreenshot('energyRental_self_end_rental.png');
    await page.locator('.end-order-modal .end-btn').click();

    // Wait for transaction to complete. Check for the "Completed" title in the transaction modal
    await page.waitForTimeout(transactionLoadingTimeout);
    await expect(page.locator('.j-transaction-modal .trans-title')).toHaveText('Completed');
    await expect(page.locator('.j-transaction-modal .loading-close')).toBeEnabled();
    // await expect(page).toHaveScreenshot('energyRental_self_end_rental_succeed.png');
    await page.locator('.j-transaction-modal .loading-close').click();

    // Wait for mini order list to refresh. Check if there is no rental order for myself
    await page.waitForTimeout(miniOrderListRefreshTimeout);
    await expect(page.locator('.rental-order-mini-list .rent-for-self-tips')).not.toBeVisible();
  });
})
*/
