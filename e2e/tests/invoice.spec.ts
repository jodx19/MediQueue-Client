import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth.helper';

test.describe('Invoice Workflow', () => {
  test('admin can view invoice list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/invoices');

    await expect(page.locator('[data-testid="page-title"]')).toContainText('Invoices');
    await expect(page.locator('[data-testid="create-invoice-btn"]')).toBeVisible();
  });

  test('create invoice button navigates to create form', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/invoices');
    await page.click('[data-testid="create-invoice-btn"]');

    await expect(page).toHaveURL(/invoices\/create/);
  });

  test('invoice list shows status badges', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/invoices');

    const badges = page.locator('[data-testid="invoice-status-badge"]');
    const count = await badges.count();
    if (count > 0) {
      const firstBadge = badges.first();
      await expect(firstBadge).toBeVisible();
      const classAttr = await firstBadge.getAttribute('class');
      expect(classAttr).toMatch(/badge-/);
    }
  });

  test('record payment navigates to payment form', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/invoices');

    const payBtns = page.locator('[data-testid="record-payment-btn"]');
    const count = await payBtns.count();
    if (count > 0) {
      await payBtns.first().click();
      await expect(page).toHaveURL(/payment/);
    }
  });
});
