# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: language-switch.spec.ts >> LanguageSwitch changes language to English on click
- Location: e2e\language-switch.spec.ts:5:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
Call log:
  - navigating to "http://localhost:3001/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.use({ baseURL: 'http://localhost:3001' });
  4  | 
  5  | test('LanguageSwitch changes language to English on click', async ({ page }) => {
> 6  |   await page.goto('/');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
  7  | 
  8  |   // Verify default language is Spanish
  9  |   await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  10 | 
  11 |   // Find and click the language switcher button
  12 |   const languageSwitch = page.locator('button[aria-label="Cambiar idioma / Change language"]');
  13 |   await expect(languageSwitch).toBeVisible();
  14 |   await languageSwitch.click();
  15 | 
  16 |   // Verify dropdown is open and shows English option
  17 |   const englishOption = page.locator('button:has-text("English")');
  18 |   await expect(englishOption).toBeVisible();
  19 | 
  20 |   // Click English option
  21 |   await englishOption.click();
  22 | 
  23 |   // Verify language changed to English
  24 |   await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  25 |   await expect(page.locator('button[aria-label="Cambiar idioma / Change language"]')).toContainText('English');
  26 | });
  27 | 
```