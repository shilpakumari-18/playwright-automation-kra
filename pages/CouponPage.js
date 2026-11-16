import { expect } from '@playwright/test';

export class CouponPage {
  constructor(page) {
    this.page = page;
    this.applyCouponButton = page.getByText('Apply coupon', {
      exact: true
    });
    this.couponInput = page.getByPlaceholder('Enter Coupon Code');
    this.applyButton = page.locator('button[aria-label="Apply"]').first();
    this.removeCouponButton = page.locator('//img[@title="cross"]');
  }
async clickApplyCoupon() {
  await this.applyCouponButton.click();
  console.log('Clicked on Apply coupon');
  }

async enterCouponCode(couponCode) {
  await this.couponInput.fill(couponCode);
  console.log(`Entered coupon code: ${couponCode}`);
  }

async applyCoupon() {
  await this.applyButton.click();
  console.log('Clicked on Apply');
  }

async applyCouponCode(couponCode) {
  await this.clickApplyCoupon();
  await this.enterCouponCode(couponCode);
  await this.applyCoupon();
  }
async removeAppliedCoupon() {
  await this.removeCouponButton.click();
  console.log('Removed applied coupon');
}
async validateCouponError() {
const errorMessage = this.page.locator('#coupon-error');
await errorMessage.waitFor({ state: 'visible' });
console.log(`Coupon error message: ${await errorMessage.innerText()}`);
}
async closeCouponModal() {
const couponDialog = this.page.locator('[class*="Dialog-module__container"]').filter({
hasText: 'No such active coupons exist'
});
const closeButton = couponDialog.locator('img[alt="cross"]');
await closeButton.waitFor({ state: 'visible' });
await closeButton.click();
console.log('Closed coupon modal');
}
}


