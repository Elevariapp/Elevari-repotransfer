import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3001' });

test('LanguageSwitch changes language to English on click', async ({ page }) => {
  await page.goto('/');

  // Verify default language is Spanish
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  // Find and click the language switcher button
  const languageSwitch = page.locator('button[aria-label="Cambiar idioma / Change language"]');
  await expect(languageSwitch).toBeVisible();
  await languageSwitch.click();

  // Verify dropdown is open and shows English option
  const englishOption = page.locator('button:has-text("English")');
  await expect(englishOption).toBeVisible();

  // Click English option
  await englishOption.click();

  // Verify language changed to English
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('button[aria-label="Cambiar idioma / Change language"]')).toContainText('English');
});
