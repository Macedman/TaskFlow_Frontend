import { expect, test } from './fixtures';

test('a card dragged to another list stays there after a reload', async ({ page, ownerApi, board }) => {
  const todo = await ownerApi.addList(board.id, 'To do');
  const done = await ownerApi.addList(board.id, 'Done');
  await ownerApi.addCard(todo.listId, 'Write report');
  await ownerApi.addCard(done.listId, 'Book flights');
  await page.goto(`/board/${board.id}`);

  const doneList = page.locator('app-list', { hasText: 'Done' });
  const source = page.locator('app-list', { hasText: 'To do' }).getByText('Write report');
  const target = doneList.getByText('Book flights');

  // the CDK only starts a drag after the pointer has moved a few pixels with the button
  // held, so move in steps rather than jumping (which is what dragTo would do)
  const from = (await source.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 5, { steps: 20 });
  const saved = page.waitForResponse(res => res.url().endsWith('/api/moveCard') && res.ok());
  await page.mouse.up();
  await saved;

  await page.reload();
  // dropped above "Book flights", so it is now first in Done
  await expect(page.locator('app-list', { hasText: 'Done' }).locator('app-taskcard'))
    .toHaveText(['Write report', 'Book flights']);
  await expect(page.locator('app-list', { hasText: 'To do' }).locator('app-taskcard')).toHaveCount(0);
});
