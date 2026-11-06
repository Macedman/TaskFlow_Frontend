import { APIRequestContext, Browser, Page, test as base } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// must match the backend port in playwright.config.ts
export const API_URL = 'http://localhost:5002';
export const ACCOUNTS_FILE = path.resolve(__dirname, '.auth/accounts.json');

export type Account = { fullname: string; email: string; password: string };
type Session = { token: string; user: { id: number; email: string; full_name: string } };
type Board = { id: number; name: string };

// The same API the app calls, used to set up state the test isn't about (a board, a list),
// so each test only drives the UI for the thing it checks
export class Api {
  constructor(private request: APIRequestContext, readonly session: Session) { }

  private async post<T>(url: string, data: object): Promise<T> {
    const res = await this.request.post(`${API_URL}${url}`, {
      data, headers: { Authorization: `Bearer ${this.session.token}` }
    });
    if (!res.ok()) throw new Error(`${url} answered ${res.status()}: ${await res.text()}`);
    return res.json();
  }

  async createBoard(name = `E2E board ${randomUUID().slice(0, 8)}`): Promise<Board> {
    const { board } = await this.post<{ board: Board }>('/api/createBoards', { name });
    return board;
  }

  addList(boardId: number, name: string) {
    return this.post<{ listId: string; listName: string }>('/api/addList', { boardId, name });
  }

  addCard(listId: string, title: string) {
    return this.post<{ id: string; title: string }>('/api/addTask', { listId, title });
  }
}

export const readAccounts = (): Record<'owner' | 'member', Account> =>
  JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));

export const logIn = async (request: APIRequestContext, account: Account): Promise<Session> => {
  const res = await request.post(`${API_URL}/api/login`, { data: { email: account.email, password: account.password } });
  if (!res.ok()) throw new Error(`Login for ${account.email} answered ${res.status()}`);
  return res.json();
};

// Puts the session where the app looks for it, before any of the app's code runs,
// so the page starts logged in without going through the login form
export const useSession = (page: Page, session: Session) =>
  page.addInitScript(s => {
    localStorage.setItem('Bearer ', s.token);
    localStorage.setItem('user', JSON.stringify(s.user));
  }, session);

// A second, separate browser (own storage, own socket) logged in as the member
export const memberPage = async (browser: Browser, request: APIRequestContext) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const account = readAccounts().member;
  await useSession(page, await logIn(request, account));
  return { page, account, close: () => context.close() };
};

export const test = base.extend<{ ownerApi: Api; board: Board }>({
  // the default `page` is logged in as the owner
  ownerApi: async ({ page, request }, use) => {
    const session = await logIn(request, readAccounts().owner);
    await useSession(page, session);
    await use(new Api(request, session));
  },
  board: async ({ ownerApi }, use) => {
    await use(await ownerApi.createBoard());
  },
});

export { expect } from '@playwright/test';
