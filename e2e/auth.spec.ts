import { randomUUID } from 'node:crypto';
import { expect, test } from './fixtures';

// The one test that signs up for real, so a run costs one of the 20 signups allowed per hour.
// A brand-new account has no boards, so it also covers the first-time journey.
test('a new user can sign up, create their first board, log out and log back in', async ({ page }) => {
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

  await page.getByRole('button', { name: 'Create your first board' }).click();
  await page.getByLabel('Board name').fill('My first board');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page).toHaveURL(/\/board\/\d+$/);

  // from the board page's navbar this time
  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => [localStorage.getItem('Bearer '), localStorage.getItem('user')])).toEqual([null, null]);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'My first board' })).toBeVisible();
});

test('pages behind the login send a logged-out visitor to the login page', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});
