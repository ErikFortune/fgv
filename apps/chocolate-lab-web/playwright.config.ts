import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Chocolate Lab Web end-to-end tests.
 *
 * Run tests with:
 * - rushx test:e2e (headless)
 * - rushx test:e2e:ui (interactive UI mode)
 * - rushx test:e2e:headed (see browser)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use downloaded Chromium (clean, isolated browser)
        launchOptions: {
          args: ['--disable-extensions', '--disable-component-extensions-with-background-pages']
        }
      }
    }
  ],

  webServer: {
    command: 'rushx dev',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe'
  }
});
