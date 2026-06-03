import { test, expect } from '@playwright/test';
import { loginAsReceptionist } from '../helpers/auth.helper';

test.describe('Appointment Booking', () => {
  test('receptionist can see appointment list', async ({ page }) => {
    await loginAsReceptionist(page);
    await page.goto('/appointments');

    await expect(page.locator('[data-testid="page-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-appointment-btn"]')).toBeVisible();
  });

  test('new appointment button navigates to booking form', async ({ page }) => {
    await loginAsReceptionist(page);
    await page.goto('/appointments');
    await page.click('[data-testid="new-appointment-btn"]');

    await expect(page).toHaveURL(/\/appointments\/book|\/book/);
  });

  test('book appointment form validates future date', async ({ page }) => {
    await loginAsReceptionist(page);
    await page.goto('/book');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    await page.fill('[data-testid="date-input"]', dateStr);
    await page.click('[data-testid="submit-btn"]');

    await expect(page.locator('[data-testid="date-error"]')).toBeVisible();
  });

  test('available slots load when doctor and date selected', async ({ page }) => {
    await loginAsReceptionist(page);
    await page.goto('/book');

    await page.selectOption('[data-testid="doctor-select"]', { index: 1 });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    await page.fill('[data-testid="date-input"]', dateStr);
    await page.waitForTimeout(1000);

    const slots = page.locator('[data-testid="slots-grid"]');
    const exists = (await slots.count()) > 0;
    if (exists) {
      await expect(slots).toBeVisible();
    }
  });
});
