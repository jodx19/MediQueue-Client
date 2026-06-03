import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', 'admin@mediqueue.com');
  await page.fill('[data-testid="password"]', 'Admin@123');
  await page.click('[data-testid="login-btn"]');
  await page.waitForURL('**/dashboard');
}

export async function loginAsDoctor(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', 'doctor@mediqueue.com');
  await page.fill('[data-testid="password"]', 'Doctor@123');
  await page.click('[data-testid="login-btn"]');
  await page.waitForURL('**/my-queue');
}

export async function loginAsReceptionist(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.fill('[data-testid="email"]', 'reception@mediqueue.com');
  await page.fill('[data-testid="password"]', 'Reception@123');
  await page.click('[data-testid="login-btn"]');
  await page.waitForURL('**/appointments');
}

export async function loginAsPatient(
  page: Page,
  mrn: string,
  dob: string,
): Promise<void> {
  await page.goto('/patient-login');
  await page.fill('[data-testid="mrn"]', mrn);
  await page.fill('[data-testid="dob"]', dob);
  await page.click('[data-testid="login-btn"]');
  await page.waitForURL('**/my-portal');
}

export async function logout(page: Page): Promise<void> {
  await page.click('[data-testid="logout-btn"]');
  await page.waitForURL('**/auth/login');
}
