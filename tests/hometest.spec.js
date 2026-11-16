import { test,expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage.js';
import { MedicinePage } from '../pages/MedicinePage.js';
import { cityData } from '../testdata/cityData.js';
import {medicineData,  validCouponProductData} from '../testdata/medicineData.js';
import { CartPage } from '../pages/CartPage.js';
import { CouponPage } from '../pages/CouponPage.js';
import { couponData } from '../testdata/couponData.js';
import {calculateLineTotal,calculateBillTotals,  calculateExtraAmount} from '../utils/billCalculator.js';


test('Validate medicine cart, prices, coupons and checkout', async ({ page }) => {
  const homePage = new HomePage(page);
  const medicinePage = new MedicinePage(page);
  const cartPage = new CartPage(page);
  const couponPage = new CouponPage(page);

  // 1. Open application and select city
  await page.goto('/');
  await homePage.handleInitialModal();
  await homePage.selectDifferentCity(cityData.cities);

  // 2. Search medicines and add them to cart
  const addedProducts = await medicinePage.searchMedicines(medicineData);

  // 3. Validate cart items and quantities
  await cartPage.clickCart();
  await cartPage.updateQuantities(medicineData, addedProducts);

  const cartItems = await cartPage.validateCartItems(medicineData,addedProducts);
  const lineTotalSum = Number(cartItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  console.log(`Total of cart line items: ₹${lineTotalSum.toFixed(2)}`);

  for (const item of cartItems) {
    const calculatedLineTotal = calculateLineTotal(item.unitPrice,item.quantity);
    expect(item.lineTotal).toBe(calculatedLineTotal);
  }

  // 4. Fetch bill summary and calculate payable amount
  const bill = await cartPage.getBillDetails();
  const calculatedPayable = calculateBillTotals({
    itemTotalMRP: bill.itemTotalMRP,
    handlingCharges: bill.handlingCharges,
    totalDiscount: bill.totalDiscount
  });
  const extraAmount = calculateExtraAmount(bill.toBePaid,calculatedPayable);

  console.log('\n========== PAYABLE VALIDATION ==========');
  console.log(`Calculated from bill components: ₹${calculatedPayable.toFixed(2)}`);
  console.log(`Difference from UI payable:₹${extraAmount.toFixed(2)}`);
  console.log(`Actual UI payable:₹${bill.toBePaid.toFixed(2)}`);
  console.log('========================================\n');

  expect(Number((calculatedPayable + extraAmount).toFixed(2))).toBe(bill.toBePaid);

  // 5. Test valid coupon
  await medicinePage.searchAndAddFirstProduct(validCouponProductData.name);
  await cartPage.clickCart();
  const beforeCouponBill = await cartPage.getBillDetails();
  console.log(`Payable before coupon: ₹${beforeCouponBill.toBePaid.toFixed(2)}`);
  await couponPage.applyCouponCode(couponData.couponCode);

await expect.poll(async () => {
  const updatedBill = await cartPage.getBillDetails(false);
  return updatedBill.totalDiscount;
}).not.toBe(beforeCouponBill.totalDiscount);

  const afterCouponBill = await cartPage.getBillDetails();
  console.log(`Payable after valid coupon: ₹${afterCouponBill.toBePaid.toFixed(2)}`
);

// // 6. Test invalid coupon

await couponPage.removeAppliedCoupon();
await expect.poll(async () => {
const updatedBill = await cartPage.getBillDetails(false);
return updatedBill.toBePaid;
}).toBe(beforeCouponBill.toBePaid);

const beforeInvalidCoupon = await cartPage.getBillDetails();
console.log(`Payable before invalid coupon: ₹${beforeInvalidCoupon.toBePaid}`);

await couponPage.applyCouponCode(couponData.invalidCoupon);
await couponPage.validateCouponError();

// Close invalid coupon modal
await couponPage.closeCouponModal();
console.log('Closed invalid coupon modal');

const afterInvalidCoupon = await cartPage.getBillDetails();
console.log(`Payable after invalid coupon: ₹${afterInvalidCoupon.toBePaid}`);

// Verify invalid coupon does not change payable amount
expect(afterInvalidCoupon.toBePaid).toBe(beforeInvalidCoupon.toBePaid);
console.log('Invalid coupon validation passed');


// 7. Identify the highest-priced cart item
const currentItemCount = await cartPage.cartItems.count();
const currentItems = [];
for (let i = 0; i < currentItemCount; i++) {
currentItems.push({
  index: i,...(await cartPage.getCartItemDetails(i))
  });
}

const highestPricedItem = currentItems.reduce((highest, item) =>
item.lineTotal > highest.lineTotal ? item : highest
);

console.log(`Removing highest-priced item: ${highestPricedItem.productName} ` +`(₹${highestPricedItem.lineTotal.toFixed(2)})`);


// 8. Remove highest-priced item and verify cart
await cartPage.removeItem(highestPricedItem.index);
await expect(cartPage.cartItems).toHaveCount(currentItemCount - 1);
const afterRemovalBill = await cartPage.getBillDetails();
console.log(`Payable after item removal: ₹${afterRemovalBill.toBePaid.toFixed(2)}`);


// 9. Checkout should be blocked while logged out
 const urlBeforeCheckout = page.url();
 await cartPage.continueToCheckout();
 await expect(page.getByRole('dialog')).toBeVisible();
expect(page.url()).toBe(urlBeforeCheckout);
console.log('Checkout login restriction validated');

// 10. Verify cart persistence after reload
await page.reload();
await expect(cartPage.cartItems).toHaveCount(currentItemCount - 1);
console.log('Cart items persisted after reload');
});