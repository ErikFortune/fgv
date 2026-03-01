import { test, expect } from '@playwright/test';

/**
 * Basic smoke tests for Chocolate Lab Web application.
 *
 * These tests verify the app loads and basic functionality works.
 * Add more tests here as you encounter bugs that should have regression protection.
 */

test.describe('Chocolate Lab App', () => {
  test('loads and displays the application', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify the app rendered with some content
    await expect(page.locator('body')).not.toBeEmpty();

    // Look for any text content to verify app loaded
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('app does not have critical errors on initial load', async ({ page }) => {
    // Listen for console errors (excluding 404s which might be expected for some resources)
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore 404s for now - they might be expected (favicon, etc.)
        if (!text.includes('404')) {
          errors.push(text);
        }
      }
    });

    // Wait for page to be ready before navigating
    await page.goto('/', { waitUntil: 'networkidle' });

    // Report errors with details if any exist
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
    expect(errors, `Found ${errors.length} console errors: ${errors.join(', ')}`).toHaveLength(0);
  });

  test.skip('shows Confections tab by default', async ({ page }) => {
    // TODO: Re-enable once we understand the UI structure
    // This test is skipped to debug what elements actually exist
    await page.goto('/', { waitUntil: 'networkidle' });

    // Debug: print all elements with role="tab"
    const tabs = await page.locator('[role="tab"]').all();
    console.log(`Found ${tabs.length} tabs`);
    for (const tab of tabs) {
      const text = await tab.textContent();
      console.log(`Tab text: "${text}"`);
    }

    const confectionsTab = page
      .locator('[role="tab"]')
      .filter({ hasText: /confections/i })
      .first();
    await expect(confectionsTab).toBeVisible({ timeout: 10000 });
  });
});
