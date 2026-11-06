import { defineConfig, devices } from '@playwright/test';

// Their own ports, so the dev servers on 4300/5001 (and the real taskflow database) are never touched.
// The API's address is in e2e/fixtures.ts and src/environments/environment.e2e.ts
const APP_URL = 'http://localhost:4400';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  // every test makes its own board, so tests can run side by side
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npx tsx src/index.ts',
      cwd: '../TaskFlow_Backend',
      port: 5002,
      // set here, not in .env: dotenv never overrides a variable that's already set,
      // so this backend can only ever use the test database
      env: {
        DB_NAME: 'taskflow_test',
        PORT: '5002',
        CORS_ORIGIN: APP_URL,
      },
      reuseExistingServer: !process.env['CI'],
      timeout: 60_000,
    },
    {
      // no watching: the tests write files inside this folder (traces, reports), and a rebuild
      // would reload every open page in the middle of a test
      command: 'npx ng serve --configuration e2e --port 4400 --watch=false --live-reload=false --hmr=false',
      url: APP_URL,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
  ],
});
