import { expect, memberPage, test } from './fixtures';

// Two separate browsers: the owner's (the default page) and the member's
test('a shared board updates live for the member, who is sent away once removed', async ({ page, ownerApi, board, browser, request }) => {
  await ownerApi.addList(board.id, 'To do');
  const member = await memberPage(browser, request);

  try {
    await page.goto(`/board/${board.id}`);
    await page.getByRole('button', { name: 'Share' }).click();
    await page.getByLabel('Invite by email').fill(member.account.email);
    await page.getByRole('button', { name: 'Invite' }).click();
    await expect(page.getByText(member.account.fullname)).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    await member.page.goto(`/board/${board.id}`);
    await expect(member.page.locator('app-list', { hasText: 'To do' })).toBeVisible();

    // added by the owner; the member's board shows it with no reload
    const list = page.locator('app-list', { hasText: 'To do' });
    await list.getByRole('button', { name: 'Add Card' }).click();
    await list.getByRole('textbox', { name: 'Add new card' }).fill('Plan the trip');
    await list.getByRole('button', { name: 'Add new card' }).click();
    await expect(member.page.getByText('Plan the trip')).toBeVisible();

    await page.getByRole('button', { name: 'Share' }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: `Remove ${member.account.fullname}` }).click();

    await expect(member.page).toHaveURL(/\/dashboard$/);
    await expect(member.page.getByRole('status')).toHaveText('You were removed from that board.');
  } finally {
    await member.close();
  }
});
