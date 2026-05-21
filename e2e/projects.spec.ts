/**
 * E2E Tests for Low Code Platform - Projects API
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

test.describe('Projects API', () => {
  let authToken: string;
  let testProjectId: string;

  test.beforeAll(async ({ request }) => {
    const timestamp = Date.now();
    const registerRes = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        username: `proj_test_user_${timestamp}`,
        email: `proj_test_${timestamp}@example.com`,
        password: 'password123',
      },
    });
    expect(registerRes.ok()).toBeTruthy();
    authToken = (await registerRes.json()).data.token;
  });

  test.afterAll(async ({ request }) => {
    if (testProjectId) {
      await request.delete(`${BASE_URL}/projects/${testProjectId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    }
  });

  test('POST /projects - should create a new project', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: '测试项目',
        description: 'E2E 测试项目',
      },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('测试项目');
    testProjectId = body.data.id;
  });

  test('GET /projects - should return project list', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /projects/:id - should return single project', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/projects/${testProjectId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(testProjectId);
    expect(body.data.pages).toBeDefined();
  });

  test('PUT /projects/:id - should update project', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/projects/${testProjectId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: '更新的项目名',
        description: '更新后的描述',
      },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('更新的项目名');
  });

  test('should return 403 when accessing another user project', async ({ request }) => {
    const registerRes = await request.post(`${BASE_URL}/auth/register`, {
      data: {
        username: `proj_other_${Date.now()}`,
        email: `proj_other_${Date.now()}@example.com`,
        password: 'password123',
      },
    });
    const otherToken = (await registerRes.json()).data.token;

    const res = await request.get(`${BASE_URL}/projects/${testProjectId}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('DELETE /projects/:id - should delete project', async ({ request }) => {
    const createRes = await request.post(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: '待删除项目' },
    });
    const deleteId = (await createRes.json()).data.id;

    const res = await request.delete(`${BASE_URL}/projects/${deleteId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('should return 401 without auth token', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/projects`);
    expect(res.status()).toBe(401);
  });

  test('should return 400 for invalid project name', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: '' },
    });
    expect(res.status()).toBe(400);
  });
});
