import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsDoctor, logout } from '../helpers/auth.helper';

test.describe('Authentication', () => {
  test('admin can login and sees dashboard', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'admin@mediqueue.com');
    await page.fill('[data-testid="password"]', 'Admin@123');
    await page.click('[data-testid="login-btn"]');

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('[data-testid="page-title"]')).toContainText('Dashboard');
  });

  test('wrong password shows error message', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'admin@mediqueue.com');
    await page.fill('[data-testid="password"]', 'WrongPass123!');
    await page.click('[data-testid="login-btn"]');

    await expect(page.locator('[data-testid="error-msg"]')).toBeVisible();
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('patient logs in with MRN + DOB', async ({ page }) => {
    await page.goto('/patient-login');
    await page.fill('[data-testid="mrn"]', 'MRN-001');
    await page.fill('[data-testid="dob"]', '1990-01-15');
    await page.click('[data-testid="login-btn"]');

    await expect(page).toHaveURL(/my-portal/);
  });

  test('doctor cannot access admin dashboard', async ({ page }) => {
    await loginAsDoctor(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/403/);
  });

  test('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('admin can logout', async ({ page }) => {
    await loginAsAdmin(page);
    await logout(page);
    await expect(page).toHaveURL(/auth\/login/);
  });
});
