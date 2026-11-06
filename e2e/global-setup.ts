import { request } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Account, ACCOUNTS_FILE, API_URL } from './fixtures';

// Signup is rate limited (20 per hour per address), so the owner and member accounts are
// made once and reused. They are only made again when the backend tests have wiped
// taskflow_test, which shows up here as a failed login.
export default async function globalSetup() {
  const api = await request.newContext({ baseURL: API_URL });
  const saved: Partial<Record<'owner' | 'member', Account>> =
    fs.existsSync(ACCOUNTS_FILE) ? JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')) : {};

  const ensure = async (role: 'owner' | 'member', fullname: string): Promise<Account> => {
    const existing = saved[role];
    if (existing) {
      const login = await api.post('/api/login', { data: { email: existing.email, password: existing.password } });
      if (login.ok()) return existing;
    }
    const account = { fullname, email: `e2e-${role}-${randomUUID()}@example.com`, password: `Pw-${randomUUID()}` };
    const signup = await api.post('/api/signup', { data: account });
    if (!signup.ok()) throw new Error(`Couldn't create the e2e ${role} account: ${signup.status()} ${await signup.text()}`);
    return account;
  };

  const accounts = { owner: await ensure('owner', 'E2E Owner'), member: await ensure('member', 'E2E Member') };
  fs.mkdirSync(path.dirname(ACCOUNTS_FILE), { recursive: true });
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  await api.dispose();
}
