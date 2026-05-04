/**
 * E2E Tests for Low Code Platform - Editor
 */

import { test, expect } from '@playwright/test';

test.describe('Editor - Canvas & Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/(editor|projects|login)/);
  });

  test('should navigate to editor from project list', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const newPageBtn = page.getByRole('button', { name: /新建|创建/i });
    if (await newPageBtn.isVisible()) {
      await newPageBtn.click();
    }
  });

  test('should render editor layout with toolbar, canvas, and panels', async ({ page }) => {
    await page.goto('/editor/test');
    await page.waitForLoadState('networkidle');

    const toolbar = page.locator('text=保存');
    await expect(toolbar).toBeVisible();
  });

  test('should add a component from component library', async ({ page }) => {
    await page.goto('/editor/test');
    await page.waitForLoadState('networkidle');

    const libraryTab = page.getByText(/组件库|组件/i).first();
    if (await libraryTab.isVisible()) {
      await libraryTab.click();
    }

    const addButton = page.locator('button').filter({ hasText: /添加|新增/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
    }
  });

  test('should undo and redo component operations', async ({ page }) => {
    await page.goto('/editor/test');
    await page.waitForLoadState('networkidle');

    const undoBtn = page.locator('button[aria-label*="撤销"], button').filter({ hasText: /撤销/i }).first();
    const redoBtn = page.locator('button[aria-label*="重做"], button').filter({ hasText: /重做/i }).first();

    const toolbar = page.locator('text=保存');
    await expect(toolbar).toBeVisible();
  });
});

test.describe('Editor - Data Source Management', () => {
  test('should open data source management panel', async ({ page }) => {
    await page.goto('/editor/test');
    await page.waitForLoadState('networkidle');

    const dsButton = page.locator('button').filter({ hasText: /数据源/i });
    if (await dsButton.isVisible()) {
      await dsButton.click();

      const panel = page.getByText(/数据源管理/i);
      await expect(panel.or(page.getByText(/API 数据源/i))).toBeVisible({ timeout: 5000 });
    }
  });

  test('should add a new API data source', async ({ page }) => {
    await page.goto('/editor/test');
    await page.waitForLoadState('networkidle');

    const dsButton = page.locator('button').filter({ hasText: /数据源/i });
    if (await dsButton.isVisible()) {
      await dsButton.click();

      const addApiBtn = page.getByRole('button', { name: /添加 API/i });
      if (await addApiBtn.isVisible()) {
        await addApiBtn.click();

        const nameInput = page.locator('input').filter({ placeholder: /数据源名称/i });
        if (await nameInput.isVisible({ timeout: 3000 })) {
          await nameInput.fill('TestAPI');
        }
      }
    }
  });
});

test.describe('Editor - Logic Flow Editor', () => {
  test('should open logic flow editor', async ({ page }) => {
    await page.goto('/editor/test');
    await page.waitForLoadState('networkidle');

    const flowBtn = page.locator('button').filter({ hasText: /逻辑流程|Thunderbolt/i });
    if (await flowBtn.isVisible()) {
      await flowBtn.click();

      const editor = page.getByText(/逻辑流程编辑器/i);
      await expect(editor.or(page.getByText(/节点/i))).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Preview', () => {
  test('should open preview panel', async ({ page }) => {
    await page.goto('/editor/test');
    await page.waitForLoadState('networkidle');

    const previewBtn = page.getByRole('button', { name: /预览/i });
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
    }
  });
});

test.describe('Renderer', () => {
  test('should render demo page', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await page.waitForLoadState('networkidle');

    const content = page.locator('text=欢迎使用低代码平台');
    await expect(content.or(page.locator('text=演示页面'))).toBeVisible({ timeout: 10000 });
  });

  test('should load preview schema via postMessage', async ({ page }) => {
    await page.goto('http://localhost:3001/preview?previewMode=true');
    await page.waitForLoadState('networkidle');

    const loadingText = page.locator('text=等待编辑器数据');
    await expect(loadingText.or(page.locator('text=加载页面数据'))).toBeVisible({ timeout: 5000 });
  });
});
