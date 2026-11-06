import { expect, test } from './fixtures';

test('a link and an uploaded PDF are attached to a card and still there after a reload', async ({ page, ownerApi, board }) => {
  const list = await ownerApi.addList(board.id, 'To do');
  await ownerApi.addCard(list.listId, 'Read the spec');
  await page.goto(`/board/${board.id}`);
  await page.getByText('Read the spec').click();

  await page.getByRole('button', { name: 'Add attachment' }).click();
  await page.getByRole('textbox', { name: 'Link URL' }).fill('https://example.com/spec');
  await page.getByRole('textbox', { name: 'Link display text' }).fill('The spec');
  await page.getByRole('button', { name: 'Attach link' }).click();
  await expect(page.getByTestId('attachment-link')).toHaveText('The spec');

  // the server checks the file starts with %PDF-, so this is a (tiny) real PDF header
  await page.getByRole('button', { name: 'Add attachment' }).click();
  await page.getByLabel('Upload a PDF').setInputFiles({
    name: 'notes.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%%EOF\n'),
  });
  await expect(page.getByTestId('attachment-file')).toHaveText('notes.pdf');

  await page.reload();
  await page.getByText('Read the spec').click();
  await expect(page.getByTestId('attachment-link')).toHaveText('The spec');
  await expect(page.getByTestId('attachment-file')).toHaveText('notes.pdf');
});
