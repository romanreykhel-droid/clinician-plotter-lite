import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',                       // where tests live
  use: { baseURL: 'http://localhost:5173' }, // Vite's default URL
  webServer: {
    command: 'npm run dev',               // how to start your app
    port: 5173,                           // must match baseURL
    reuseExistingServer: true,            // don't restart if already running
    timeout: 60_000,                      // give it time to boot
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
