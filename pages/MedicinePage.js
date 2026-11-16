
import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class MedicinePage extends BasePage {
  constructor(page) {
    super(page);
  this.searchInput = page.getByPlaceholder('Search for Medicines and Health Products');
  this.productCards = page.locator('[class*="VerticalProductTile-module__container"]');
  this.cartButton = page.getByAltText('cart');
  }
async searchMedicine(medicineName) {
  await this.searchInput.fill(medicineName);
  await this.searchInput.press('Enter');
  await expect(this.productCards.first()).toBeVisible();
  console.log(`Searched for: ${medicineName}`);
  }
async getFirstProductDetails() {
  const product = this.productCards.first();
  const productName = await product.locator('img[title]').getAttribute('title');
  const packSize = (
  await product.locator('.xSmallRegular.textSecondary').first().textContent())?.trim();
  const priceText = await product.locator('span.textPrimary.l5Medium').textContent();
  const sellingPrice = Number(priceText.replace(/[^0-9.]/g, ''));
    return {
    productName: productName?.trim(),
    packSize,
    sellingPrice
    };
  }
async getCartBadgeCount() {
  const cartLink = this.page.getByAltText('cart icon').locator('xpath=..');
  const badge = cartLink.locator('[class*="quantityPopup"] [class*="AnimateTag-module__tag"]');
  await expect(badge).toBeVisible();
  return Number((await badge.first().innerText()).trim());
}

async searchMedicines(medicineData) {
  const products = [];
  for (let i = 0; i < medicineData.length; i++) {
  const medicine = medicineData[i];
  await this.searchMedicine(medicine.name);
  const details = await this.getFirstProductDetails();
  await this.productCards.first().getByRole('button', { name: 'Add to cart' }).click();
  console.log(`${medicine.name} - Actual Selling Price: ₹${details.sellingPrice}`);
  console.log(`Added ${medicine.name} to cart`);
  await expect.poll(() => this.getCartBadgeCount(),
    {
      message: `Waiting for cart count to become ${i + 1}`,
      timeout: 10000
      }
    ).toBe(i + 1);
  if (medicine.name === 'Dolo 650 mg') {
  await this.closePricePopupIfVisible();
}
products.push({
  searchName: medicine.name,
  productName: details.productName,
  packSize: details.packSize,
  sellingPrice: details.sellingPrice,
  quantity: medicine.quantity
    });
  }
  return products;
}
async closePricePopupIfVisible() {
  const popup = this.page.locator('[class*="Dialog-module__vsatOverlay"][class*="vsatOpen"]');
  const closeButton = popup.getByAltText('cross');
  try {
await closeButton.waitFor({
      state: 'visible',
      timeout: 5000
    });

await closeButton.click();
await popup.waitFor({
  state: 'hidden',
  timeout: 5000
  });
  console.log('Dolo price popup closed');
  } catch (error) {
    const popupVisible = await popup.isVisible().catch(() => false);

    if (popupVisible) {
      throw error;
    }

    console.log('Dolo price popup did not appear');
  }
}

async searchAndAddFirstProduct(searchTerm) {
  await this.searchMedicine(searchTerm);
  const details = await this.getFirstProductDetails();
await this.productCards.first().getByRole('button', { name: 'Add to cart' }).click();
  await this.page.waitForTimeout(3000);
  console.log(`Added to cart: ${details.productName}`);
  return {
  ...details,
   quantity: 1
    };
  }
}
