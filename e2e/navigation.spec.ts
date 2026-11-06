import { randomUUID } from 'node:crypto';
import { expect, test } from './fixtures';

// asking for ownerApi is what logs the page in as the owner, even though the test never calls it
test('a board created from the navbar opens straight away and is listed under Boards', async ({ page, ownerApi: _ }) => {
  const name = `Navbar board ${randomUUID().slice(0, 8)}`;
  await page.goto('/dashboard');

  await page.getByRole('button', { name: 'Create board' }).click();
  // Create stays disabled until there's a name that isn't just spaces
  await page.getByLabel('Board name').fill('   ');
  await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();
  await page.getByLabel('Board name').fill(name);
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await expect(page).toHaveURL(/\/board\/\d+$/);
  await page.getByRole('button', { name: '+ Add another list' }).click();
  await page.getByRole('textbox', { name: 'Add new list' }).fill('To do');
  await page.getByRole('button', { name: 'Add new list' }).click();
  await expect(page.locator('app-list', { hasText: 'To do' })).toBeVisible();

  await page.getByRole('link', { name: 'Boards' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name })).toBeVisible();
});

test('the account menu shows who is logged in and closes with Escape', async ({ page, ownerApi }) => {
  await page.goto('/dashboard');

  await page.getByRole('button', { name: 'Account' }).click();
  const menu = page.getByRole('menu');
  await expect(menu).toContainText(ownerApi.session.user.full_name);
  await expect(menu).toContainText(ownerApi.session.user.email);

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});
