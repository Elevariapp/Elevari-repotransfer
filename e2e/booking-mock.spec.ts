import { test, expect } from '@playwright/test';

const DEMO_EMAIL = 'guest@wana.local';
const DEMO_PASSWORD = 'wana12345';
const PROPERTY_SLUG = 'glamping-wana';

async function loginAsGuest(page: import('@playwright/test').Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(DEMO_EMAIL);
  await page.getByLabel('Contraseña').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/auth\/login/);
}

/** Pick two future nights in the visible calendar (desktop widget). */
async function selectFutureDates(page: import('@playwright/test').Page) {
  const enabledDays = page.locator('.rdp-day_button:not([disabled])');
  await expect(enabledDays.first()).toBeVisible({ timeout: 15_000 });
  const count = await enabledDays.count();
  expect(count).toBeGreaterThan(3);
  await enabledDays.nth(count - 3).click();
  await enabledDays.nth(count - 2).click();
}

test.describe('Pre-live mock booking', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('browse properties after login', async ({ page }) => {
    await loginAsGuest(page);
    await page.goto('/properties');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator(`a[href*="/properties/${PROPERTY_SLUG}"]`).first()).toBeVisible();
  });

  test('full flow: reserve → mock Wompi payment → confirmed', async ({ page }) => {
    await loginAsGuest(page);
    await page.goto(`/properties/${PROPERTY_SLUG}`);
    await expect(page.getByRole('button', { name: 'Reservar' }).first()).toBeVisible();

    await selectFutureDates(page);

    const reserveBtn = page.getByRole('button', { name: 'Reservar' }).first();
    await expect(reserveBtn).toBeEnabled({ timeout: 20_000 });
    await reserveBtn.click();

    await expect(page).toHaveURL(/\/checkout\//, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Confirma y paga' })).toBeVisible();

    await page.getByRole('button', { name: 'Wompi' }).click();

    await expect(page).toHaveURL(/\/checkout\/.*\/success/, { timeout: 30_000 });
    await expect(page.getByText(/confirmada|Confirmada/i)).toBeVisible({ timeout: 30_000 });
  });
});
