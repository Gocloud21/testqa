import { test, expect } from '@playwright/test';
import { TaskApi } from './helpers/task-page';

test.describe('Health Check', () => {
  test('GET /health returns ok', async ({ page }) => {
    const api = new TaskApi(page);
    const body = await api.health();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeTruthy();
  });
});

test.describe('Tasks API — CRUD', () => {
  let api: TaskApi;

  test.beforeEach(async ({ page }) => {
    api = new TaskApi(page);
    await api.reset();
  });

  test('GET /api/tasks returns initial seed data', async () => {
    const tasks = await api.getAll();
    expect(tasks).toHaveLength(3);
    expect(tasks[0]).toMatchObject({ title: 'Set up the project', completed: true });
  });

  test('POST /api/tasks creates a new task', async () => {
    const task = await api.create('Write more tests');
    expect(task.id).toBeGreaterThan(0);
    expect(task.title).toBe('Write more tests');
    expect(task.completed).toBe(false);

    const all = await api.getAll();
    expect(all).toHaveLength(4);
  });

  test('POST /api/tasks trims whitespace from title', async () => {
    const task = await api.create('  Trimmed title  ');
    expect(task.title).toBe('Trimmed title');
  });

  test('POST /api/tasks returns 400 when title is missing', async ({ page }) => {
    const res = await page.request.post('/api/tasks', { data: {} });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('POST /api/tasks returns 400 when title is empty string', async ({ page }) => {
    const res = await page.request.post('/api/tasks', { data: { title: '   ' } });
    expect(res.status()).toBe(400);
  });

  test('PATCH /api/tasks/:id toggles completed', async () => {
    const tasks = await api.getAll();
    const task = tasks[1]; // completed: false
    expect(task.completed).toBe(false);

    const updated = await api.patch(task.id, { completed: true });
    expect(updated.completed).toBe(true);
    expect(updated.id).toBe(task.id);
  });

  test('PATCH /api/tasks/:id updates title', async () => {
    const tasks = await api.getAll();
    const updated = await api.patch(tasks[0].id, { title: 'Updated title' });
    expect(updated.title).toBe('Updated title');
  });

  test('PATCH /api/tasks/:id returns 404 for unknown id', async ({ page }) => {
    const res = await page.request.patch('/api/tasks/9999', { data: { completed: true } });
    expect(res.status()).toBe(404);
  });

  test('DELETE /api/tasks/:id removes the task', async () => {
    const tasks = await api.getAll();
    await api.delete(tasks[0].id);

    const remaining = await api.getAll();
    expect(remaining).toHaveLength(2);
    expect(remaining.find(t => t.id === tasks[0].id)).toBeUndefined();
  });

  test('DELETE /api/tasks/:id returns 404 for unknown id', async ({ page }) => {
    const res = await page.request.delete('/api/tasks/9999');
    expect(res.status()).toBe(404);
  });
});
