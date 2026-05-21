/**
 * E2E Tests for Low Code Platform - Pages API
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

test.describe('Pages API', () => {
  let authToken: string;
  let testPageId: string;

  test.beforeAll(async ({ request }) => {
    const timestamp = Date.now();
    const registerRes = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        username: `pages_test_user_${timestamp}`,
        email: `pages_test_${timestamp}@example.com`,
        password: 'password123',
      },
    });
    expect(registerRes.ok()).toBeTruthy();
    const registerBody = await registerRes.json();
    authToken = registerBody.data.token;
  });

  test.afterAll(async ({ request }) => {
    if (authToken) {
      await request.delete(`${BASE_URL}/pages/${testPageId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    }
  });

  test('POST /pages - should create a new page', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/pages`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'test-page',
        title: '测试页面',
        description: 'API 测试页面',
        schema: {
          version: '1.0.0',
          page: {
            title: '测试页面',
            layout: 'flex',
            props: { padding: 16 },
            components: [],
          },
          dataSources: {},
          logic: {},
        },
      },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('test-page');
    expect(body.data.version).toBe(1);
    testPageId = body.data.id;
  });

  test('GET /pages - should return page list', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/pages`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /pages/:id - should return single page', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/pages/${testPageId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(testPageId);
    expect(body.data.schema).toBeDefined();
    expect(body.data.schema.page.title).toBe('测试页面');
  });

  test('PUT /pages/:id - should update page and create version', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/pages/${testPageId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        schema: {
          version: '1.0.0',
          page: {
            title: '更新后的页面',
            layout: 'flex',
            props: { padding: 32 },
            components: [],
          },
          dataSources: {},
          logic: {},
        },
        comment: '测试版本更新',
      },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.version).toBe(2);
  });

  test('GET /pages/:id/versions - should return version history', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/pages/${testPageId}/versions`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
  });

  test('POST /pages/:id/rollback/:version - should rollback to previous version', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/pages/${testPageId}/rollback/1`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.version).toBe(3);
  });

  test('POST /pages/:id/publish - should publish page', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/pages/${testPageId}/publish`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.isPublished).toBe(true);
    expect(body.data.publishedAt).toBeDefined();
  });

  test('POST /pages/:id/unpublish - should unpublish page', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/pages/${testPageId}/unpublish`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.isPublished).toBe(false);
  });

  test('GET /pages/:id/export - should return export info', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/pages/${testPageId}/export`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.pageId).toBe(testPageId);
    expect(body.data.format).toBe('zip');
  });

  test('DELETE /pages/:id - should delete page', async ({ request }) => {
    const createRes = await request.post(`${BASE_URL}/pages`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'to-be-deleted',
        title: '待删除页面',
        schema: {
          version: '1.0.0',
          page: { title: '待删除', layout: 'flex', props: {}, components: [] },
          dataSources: {},
          logic: {},
        },
      },
    });
    const newPageId = (await createRes.json()).data.id;

    const res = await request.delete(`${BASE_URL}/pages/${newPageId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);

    const getRes = await request.get(`${BASE_URL}/pages/${newPageId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(getRes.status()).toBe(404);
  });

  test('should return 401 without auth token', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/pages`);
    expect(res.status()).toBe(401);
  });

  test('should return 404 for non-existent page', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/pages/non-existent-id`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status()).toBe(404);
  });
});
