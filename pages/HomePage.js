import { BasePage } from './BasePage.js';

export class HomePage extends BasePage {
  constructor(page) {
    super(page);

this.assistanceModal = page.locator("//div[@id='google_ads_iframe_67416580/DWEB_ROADBLOCK_900x493_PROD_0__container__']");
this.closeModalButton = this.assistanceModal.locator('img[alt="cross"]');
this.citySelector = page.getByPlaceholder('Enter your city');
this.citySearchInput = page.getByLabel('Enter your city');  }

async handleInitialModal() {
  if (await this.assistanceModal.isVisible({ timeout: 2000 }).catch(() => false)) {
  await this.closeModalButton.click();
  console.log('Initial modal closed');
  }
}
  async selectDifferentCity(cities) {
  const defaultCity = (await this.citySelector.innerText()).trim();

  await this.citySelector.click();

  for (const city of cities) {
    if (city !== defaultCity) {
      await this.citySearchInput.fill(city);
      await this.page.getByText(city, { exact: true }).click();
      console.log(`Selected city: ${city}`);

      break;
    }
  }

  }
}
