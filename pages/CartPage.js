
import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class CartPage extends BasePage {
  constructor(page) {
  super(page);
  this.cartButton = page.getByAltText('cart');
  this.cartItems = page.locator('a[href^="/drugs/"]' + ':has(.bodySemiBold.textPrimary)' +
  ':has(.smallRegular.textSecondary)' +':has([class*="QuantitySelector-module__countHeightWidth"])');
  this.toBePaidLabel = page.getByText('To be paid', {
    exact: true,
    ignoreCase: true
    });
  }
  
  async clickCart() {
    await this.cartButton.click();
    await expect(this.cartItems.first()).toBeVisible();
    console.log('Clicked on Cart');
  }
  getCartItem(index) {
  return this.cartItems.nth(index);
  }

  async getQuantity(index) {
  const quantityText = await this.getCartItem(index)
 .locator('[class*="QuantitySelector-module__countHeightWidth"]')
 .textContent();
  return Number(quantityText.trim());
  }
async increaseQuantity(index, targetQuantity) {
  const item = this.getCartItem(index);
  const quantity = item.locator('[class*="QuantitySelector-module__countHeightWidth"]');
  let currentQuantity = await this.getQuantity(index);
  while (currentQuantity < targetQuantity) {
  await item.getByAltText('add quantity').click();
  await expect(quantity).toHaveText(String(currentQuantity + 1));
  currentQuantity = await this.getQuantity(index);
  }
  console.log(`Cart item ${index + 1} quantity updated to ${currentQuantity}`);
}
async updateQuantities(medicineData, addedProducts) {
  for (const medicine of medicineData) {
  const expectedProduct = addedProducts.find(
  product => product.searchName === medicine.name);
  const index = await this.findCartItemIndex(expectedProduct.productName);
  await this.increaseQuantity(index, medicine.quantity);
    }
  }
  async getProductName(index) {
  const text = await this.getCartItem(index).locator('.bodySemiBold.textPrimary').textContent();
  return text.trim();
  }
  async getPackSize(index) {
  const text = await this.getCartItem(index).locator('.smallRegular.textSecondary').textContent();
  return text.trim();
  }
  async getUnitPrice(index) {
  const item = this.getCartItem(index);
  const priceText = await item.locator('span.textPrimary.l4Medium').first().textContent();
  const displayedAmount = Number(priceText.replace(/[^0-9.]/g, ''));
  const quantity = await this.getQuantity(index);
  return Number((displayedAmount / quantity).toFixed(2));
  }

  async getCartItemDetails(index) {
  const productName = await this.getProductName(index);
  const packSize = await this.getPackSize(index);
  const quantity = await this.getQuantity(index);

  const priceText = await this.getCartItem(index).locator('span.textPrimary.l4Medium').first().innerText();
  const displayedAmount = Number(priceText.replace(/[^0-9.]/g, ''));
  const lineTotal = displayedAmount;
  const unitPrice = Number((lineTotal / quantity).toFixed(2));

  return {
    productName,
    packSize,
    quantity,
    unitPrice,
    lineTotal
  };
}

 async findCartItemIndex(productName) {
 const count = await this.cartItems.count();
 const normalizeName = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, ' ');

  for (let i = 0; i < count; i++) {
    const actualName = await this.getProductName(i);
    if (normalizeName(actualName) === normalizeName(productName)) {
    return i;
    }
  }
 throw new Error(`Cart item not found: ${productName}`);
}

async validateCartItems(medicineData, addedProducts) {
await expect(this.cartItems).toHaveCount(medicineData.length);

const count = await this.cartItems.count();
const actualItems = [];
console.log('\n========== CART DETAILS ==========');

for (const expected of addedProducts) {
  const index = await this.findCartItemIndex(expected.productName);
  const details = await this.getCartItemDetails(index);
    console.log(`Product: ${details.productName}`);
    console.log(`Pack Size: ${details.packSize}`);
    console.log(`Quantity: ${details.quantity}`);
    console.log(`Cart Unit Price: ₹${details.unitPrice.toFixed(2)}`);
    console.log(`Cart Line Total: ₹${details.lineTotal.toFixed(2)}`);
    console.log('----------------------------------');

    expect(details.quantity).toBe(expected.quantity);
    expect(details.packSize.toLowerCase()).toBe(expected.packSize.toLowerCase());
    actualItems.push(details);
  }

  const cartTotal = Number(actualItems.reduce(((total, item) => total + item.lineTotal),0).toFixed(2));

  console.log(`Number of products: ${count}`);
  console.log(`Sum of displayed cart amounts: ₹${cartTotal.toFixed(2)}`);
  console.log('==================================\n');
  return actualItems;
}

async getBreakupAmount(label) {
  const labelElement = this.page.getByText(label, {
    exact: true,
    ignoreCase: true
    });

  const row = labelElement.locator('xpath=ancestor::div[contains(@class,"justifyBetween")][1]');
  const amountText = await row.locator('p').last().textContent();
  return Number(
      amountText
        .replace(/₹/g, '')
        .replace(/,/g, '')
        .replace(/−|-/g, '-')
        .trim()
    );
  }

async getItemTotalMRP() {
  return this.getBreakupAmount('Item total (MRP)');
  }

async getHandlingCharges() {
  return this.getBreakupAmount('Handling charges');
  }

async getTotalDiscount() {
  return this.getBreakupAmount('Total discount');
  }
async getToBePaid() {
  const row = this.page.locator('div.flex.justifyBetween.l5SemiBold').filter({
  hasText: 'To be paid'
  });

  await expect(row).toBeVisible();
  const amount = row.locator('div').last();
  const text = await amount.innerText();
  return Number(text.replace(/₹/g, '').replace(/,/g, '').trim());
}
async getBillDetails(showlog = true) {
  const bill = {
  itemTotalMRP: await this.getItemTotalMRP(),
  handlingCharges: await this.getHandlingCharges(),
  totalDiscount: await this.getTotalDiscount(),
  toBePaid: await this.getToBePaid()
  };
  if(showlog){
  console.log('\n========== BILL SUMMARY ==========');
  console.log(`Item Total (MRP): ₹${bill.itemTotalMRP.toFixed(2)}`);
  console.log(`Handling Charges: ₹${bill.handlingCharges.toFixed(2)}`);
  console.log(`Total Discount: ₹${bill.totalDiscount.toFixed(2)}`);
  console.log(`To Be Paid: ₹${bill.toBePaid.toFixed(2)}`);
  console.log('==================================\n');
  }
  return bill;
}
async validateBillEquation(bill) {
  const expectedPayable = Number(
    (
      bill.itemTotalMRP +
      bill.totalDiscount +
      bill.handlingCharges
    ).toFixed(2)
  );
expect(bill.toBePaid).toBe(expectedPayable);
}

async getCartBadgeCount() {
  const badge = this.page.locator('[class*="cart"] [class*="count"], ' +'[class*="Cart"] [class*="count"]').first();
  return Number((await badge.textContent()).trim());
  }
async removeItem(index) {
  const item = this.getCartItem(index);
  const minusButton = item.locator('img[alt="reduce quantity"]');
  await minusButton.click();
  await minusButton.click();
  const removeButton = item.locator('img[alt="delete item"]');
  await removeButton.click();
  console.log(`Removed cart item ${index + 1}`);
}

async continueToCheckout() {
await this.page.getByRole('button', {
  name: 'Continue'
    }).first().click();
  console.log('Clicked Continue');
}
}
