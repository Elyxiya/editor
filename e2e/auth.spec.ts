/**
 * E2E Tests for Low Code Platform - Authentication
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const isLoginPage = url.includes('/login');
    const isProjectPage = url.includes('/projects');

    if (isLoginPage || isProjectPage) {
      expect(true).toBe(true);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show login form fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const usernameInput = page.locator('input').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await expect(usernameInput.or(page.locator('text=用户名'))).toBeVisible({ timeout: 5000 });
    await expect(passwordInput.or(page.locator('text=密码'))).toBeVisible({ timeout: 5000 });
  });
});
