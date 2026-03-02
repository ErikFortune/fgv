import { test, expect, type Page } from '@playwright/test';

/**
 * Basic smoke tests for Chocolate Lab Web application.
 *
 * These tests verify the app loads and basic functionality works.
 * Add more tests here as you encounter bugs that should have regression protection.
 */

async function openSessionsTab(page: Page): Promise<void> {
  await page.goto('/#/production/sessions', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('sessions-new-session-button')).toBeVisible();
}

async function createCollectionForActiveTab(page: Page, name: string): Promise<void> {
  await page.getByTestId('sidebar-new-collection-button').click();
  await expect(page.getByRole('heading', { name: 'New Collection' })).toBeVisible();
  await page.getByTestId('collections-create-name-input').fill(name);
  await page.getByTestId('collections-create-submit-button').click();
  await expect(page.getByRole('heading', { name: 'New Collection' })).toHaveCount(0);
}

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

  test('shows Confections tab as active by default', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Find all tabs with aria-current="page" (active tabs)
    const activeTabs = await page.locator('[aria-current="page"]').all();

    // Should have exactly one active tab
    expect(activeTabs.length, `Expected exactly 1 active tab, found ${activeTabs.length}`).toBe(1);

    // Get the text of the active tab
    const activeTabText = await activeTabs[0].textContent();

    // Verify it's the Confections tab
    expect(
      activeTabText?.toLowerCase(),
      `Expected active tab to be "Confections", but found "${activeTabText}"`
    ).toContain('confections');
  });

  test('supports unresolved recipe flow in New Session panel', async ({ page }) => {
    await openSessionsTab(page);
    await createCollectionForActiveTab(page, `playwright-sessions-${Date.now()}`);

    const newSessionButton = page.getByTestId('sessions-new-session-button');
    await expect(newSessionButton).toBeEnabled();
    await newSessionButton.click();

    await expect(page.getByRole('heading', { name: 'New Session' })).toBeVisible();

    const recipeInput = page.getByTestId('sessions-create-recipe-input');
    await recipeInput.fill('playwright-unresolved-recipe');
    await recipeInput.blur();

    const unresolvedPanel = page.getByTestId('sessions-create-unresolved-panel');
    await expect(unresolvedPanel).toBeVisible();
    await unresolvedPanel.getByRole('button', { name: 'Cancel' }).click();
    await expect(unresolvedPanel).toHaveCount(0);
  });

  test('opens New Collection dialog and resolves secret input on blur when suggestions exist', async ({
    page
  }) => {
    await page.goto('/#/production/sessions', { waitUntil: 'networkidle' });
    await page.getByTestId('sidebar-new-collection-button').click();
    await expect(page.getByRole('heading', { name: 'New Collection' })).toBeVisible();

    await page.getByTestId('collections-create-name-input').fill('Playwright Collection');
    await expect(page.getByTestId('collections-create-id-input')).toHaveValue('playwright-collection');

    const options = page.locator('#cc-secret-suggestions option');
    const optionCount = await options.count();
    if (optionCount > 0) {
      const suggestedSecret = await options.first().getAttribute('value');
      expect(suggestedSecret).toBeTruthy();

      if (suggestedSecret) {
        const secretInput = page.getByTestId('collections-create-secret-input');
        await secretInput.fill(suggestedSecret.toUpperCase());
        await secretInput.blur();
        await expect(secretInput).toHaveValue(suggestedSecret);
      }
    }

    await expect(page.getByTestId('collections-create-submit-button')).toBeEnabled();
  });
});
