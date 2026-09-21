import { defineConfig, devices } from '@playwright/test';

/**
 * Config E2E transverse (OUARE, section 2.6.3/2.6.4). Vérifie les parcours
 * critiques sur les trois navigateurs cibles (BNF-06) avant chaque merge
 * vers develop/main (voir .github/workflows/ci.yml).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }, // proxy Edge/Safari (moteurs WebKit/Chromium)
  ],
  webServer: {
    command: 'npm start -- --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
  },
});
