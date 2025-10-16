import { test, expect } from '@playwright/test';

test.describe('Complete Order Flow', () => {
  test('customer can view menu and place order', async ({ page }) => {
    // Navigate to demo restaurant menu
    await page.goto('/menu/demo-restaurant');

    // Check page loaded
    await expect(page.locator('h1')).toContainText('Demo Restaurant');

    // Wait for menu items to load
    await page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });

    // Add item to cart
    const firstItem = page.locator('[data-testid="menu-item"]').first();
    await firstItem.locator('[data-testid="add-to-cart-btn"]').click();

    // Check cart has 1 item
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');

    // Open cart
    await page.locator('[data-testid="cart-button"]').click();

    // Fill checkout form
    await page.locator('[data-testid="customer-name"]').fill('Test Customer');
    await page.locator('[data-testid="table-number"]').fill('5');
    await page.locator('[data-testid="customer-email"]').fill('test@example.com');

    // Note: In real E2E test, we would use Stripe test mode and complete the payment
    // For now, we just verify the checkout button is present
    await expect(page.locator('[data-testid="checkout-button"]')).toBeVisible();
  });

  test('owner can view orders dashboard', async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.locator('[data-testid="email-input"]').fill('owner@test.com');
    await page.locator('[data-testid="password-input"]').fill('password123');
    await page.locator('[data-testid="login-button"]').click();

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Check dashboard loaded
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Navigate to orders
    await page.locator('[data-testid="nav-orders"]').click();

    // Check orders page loaded
    await expect(page).toHaveURL(/.*orders/);
    await expect(page.locator('[data-testid="orders-list"]')).toBeVisible();
  });

  test('owner can update order status', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.locator('[data-testid="email-input"]').fill('owner@test.com');
    await page.locator('[data-testid="password-input"]').fill('password123');
    await page.locator('[data-testid="login-button"]').click();

    await page.waitForURL('/dashboard');

    // Go to orders
    await page.goto('/dashboard/orders');

    // Find first order and update status
    const firstOrder = page.locator('[data-testid="order-card"]').first();
    await firstOrder.locator('[data-testid="status-select"]').selectOption('preparing');

    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });
});
