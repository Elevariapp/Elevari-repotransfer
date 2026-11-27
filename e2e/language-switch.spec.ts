import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3001' });

/**
 * The switcher used to change `<html lang>` while the page stayed in Spanish (the message lookup
 * read keys at the wrong nesting level and server components were never refreshed). This asserts
 * the actual copy changes, which is what "translating the page" means.
 */
test('LanguageSwitch really translates the page to English and back', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByText('Escapes naturales, sin complicaciones')).toBeVisible();

  const switcher = page.getByTestId('language-switch').locator('button').first();
  await switcher.click();
  await page.getByRole('option', { name: 'English' }).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('Natural escapes, made simple')).toBeVisible();
  await expect(page.getByText('Escapes naturales, sin complicaciones')).toHaveCount(0);

  // And back to Spanish, so the choice is not one-way.
  await page.getByTestId('language-switch').locator('button').first().click();
  await page.getByRole('option', { name: 'Español' }).click();
  await expect(page.getByText('Escapes naturales, sin complicaciones')).toBeVisible();
});
