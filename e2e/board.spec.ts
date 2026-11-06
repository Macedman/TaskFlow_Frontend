import { expect, test } from './fixtures';

test('a list, a card, its description and a comment are all still there after a reload', async ({ page, board }) => {
  await page.goto(`/board/${board.id}`);

  await page.getByRole('button', { name: '+ Add another list' }).click();
  await page.getByRole('textbox', { name: 'Add new list' }).fill('To do');
  await page.getByRole('button', { name: 'Add new list' }).click();
  const list = page.locator('app-list', { hasText: 'To do' });
  await expect(list).toBeVisible();

  await list.getByRole('button', { name: 'Add Card' }).click();
  await list.getByRole('textbox', { name: 'Add new card' }).fill('Buy milk');
  await list.getByRole('button', { name: 'Add new card' }).click();
  await list.getByText('Buy milk').click();

  // a card with no description shows a placeholder box to click, not an Edit button
  await page.getByPlaceholder('Add a more detailed description...').click();
  await page.getByRole('textbox', { name: 'Card description' }).fill('Semi-skimmed, two litres');
  await page.getByRole('button', { name: 'Save description' }).click();
  await page.getByRole('button', { name: 'Write a comment' }).click();
  await page.getByRole('textbox', { name: 'Write a comment' }).fill('Got it on the way home');
  await page.getByRole('button', { name: 'Save comment' }).click();
  await expect(page.getByText('Got it on the way home')).toBeVisible();

  await page.reload();
  await page.locator('app-list', { hasText: 'To do' }).getByText('Buy milk').click();
  await expect(page.getByText('Semi-skimmed, two litres')).toBeVisible();
  await expect(page.getByText('Got it on the way home')).toBeVisible();
});
