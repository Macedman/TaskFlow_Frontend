import { randomUUID } from 'node:crypto';
import { expect, test } from './fixtures';

// The one test that signs up for real, so a run costs one of the 20 signups allowed per hour
test('a new user can sign up, then log back in', async ({ page }) => {
  const email = `e2e-signup-${randomUUID()}@example.com`;
  const password = `Pw-${randomUUID()}`;

  await page.goto('/login');
  await page.getByRole('link', { name: 'Sign up' }).click();
  await page.getByLabel('Full name').fill('E2E Signup');
  await page.getByLabel('Email').fill(email);
  // exact, so it doesn't also match "Confirm password:"
  await page.getByLabel('Password:', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Hello, E2E Signup!' })).toBeVisible();

  // there's no log-out button yet, so end the session the way logout() does
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
});

test('pages behind the login send a logged-out visitor to the login page', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});
