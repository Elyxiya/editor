/**
 * E2E Tests for Low Code Platform - Templates API
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

test.describe('Templates API', () => {
  let authToken: string;
  let testTemplateId: string;

  test.beforeAll(async ({ request }) => {
    const timestamp = Date.now();
    const registerRes = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        username: `tpl_test_user_${timestamp}`,
        email: `tpl_test_${timestamp}@example.com`,
        password: 'password123',
      },
    });
    expect(registerRes.ok()).toBeTruthy();
    authToken = (await registerRes.json()).data.token;
  });

  test.afterAll(async ({ request }) => {
    if (testTemplateId) {
      await request.delete(`${BASE_URL}/templates/${testTemplateId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    }
  });

  test('GET /templates - should return public templates (no auth)', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/templates`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /templates with category filter', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/templates?category=dashboard`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('GET /templates with search query', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/templates?search=test`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('GET /templates/meta/categories - should return categories', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/templates/meta/categories`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('POST /templates - should create a template', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/templates`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'test-template',
        title: '测试模板',
        description: 'E2E 测试模板',
        category: 'general',
        schema: {
          version: '1.0.0',
          page: {
            title: '测试模板页面',
            layout: 'flex',
            props: { padding: 16 },
            components: [
              {
                id: 'comp_1',
                type: 'Text',
                label: '文本',
                props: { text: 'Hello World' },
              },
            ],
          },
          dataSources: {},
          logic: {},
        },
        tags: ['test', 'demo'],
        isPublic: false,
      },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('test-template');
    expect(body.data.componentCount).toBe(1);
    testTemplateId = body.data.id;
  });

  test('GET /templates/:id - should return template detail', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/templates/${testTemplateId}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(testTemplateId);
    expect(body.data.schema).toBeDefined();
    expect(body.data.schema.page.title).toBe('测试模板页面');
  });

  test('PUT /templates/:id - should update template', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/templates/${testTemplateId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        title: '更新后的模板标题',
        isPublic: true,
      },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('更新后的模板标题');
    expect(body.data.isPublic).toBe(true);
  });

  test('should return 404 for non-existent template', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/templates/non-existent-id`);
    expect(res.status()).toBe(404);
  });

  test('should return 403 when updating another user template', async ({ request }) => {
    const otherRes = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        username: `tpl_other_${Date.now()}`,
        email: `tpl_other_${Date.now()}@example.com`,
        password: 'password123',
      },
    });
    const otherToken = (await otherRes.json()).data.token;

    const res = await request.put(`${BASE_URL}/templates/${testTemplateId}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
      data: { title: '非法更新' },
    });
    expect(res.status()).toBe(403);
  });

  test('DELETE /templates/:id - should delete template', async ({ request }) => {
    const createRes = await request.post(`${BASE_URL}/templates`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'to-delete',
        title: '待删除',
        schema: {
          version: '1.0.0',
          page: { title: 'Del', layout: 'flex', props: {}, components: [] },
          dataSources: {},
          logic: {},
        },
      },
    });
    const deleteId = (await createRes.json()).data.id;

    const res = await request.delete(`${BASE_URL}/templates/${deleteId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
