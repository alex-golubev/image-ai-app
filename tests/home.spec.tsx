import { expect, test } from '@playwright/test';

test.describe('Home Page', () => {
  test('should render the page with the correct heading', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('[data-testid="main-heading"]');
    await expect(heading).toHaveText('image AI');
    await expect(heading).toHaveClass(/text-4xl/);
  });

  test('should have a centered layout', async ({ page }) => {
    await page.goto('/');

    const container = page.locator('[data-testid="main-content"]');
    await expect(container).toHaveClass(/flex justify-center items-center min-h-screen/);
  });
});
