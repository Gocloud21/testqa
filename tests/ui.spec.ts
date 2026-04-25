import { test, expect } from '@playwright/test';
import { TaskPage } from './helpers/task-page';

test.describe('TaskFlow UI', () => {
  let ui: TaskPage;

  test.beforeEach(async ({ page }) => {
    ui = new TaskPage(page);
    await ui.resetState();
    await ui.goto();
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test('page loads with correct title and heading', async ({ page }) => {
    await expect(page).toHaveTitle('TaskFlow');
    await expect(page.locator('h1')).toContainText('TaskFlow');
  });

  test('shows the three seed tasks on load', async () => {
    const count = await ui.getTaskCount();
    expect(count).toBe(3);
  });

  test('first seed task is shown as completed', async ({ page }) => {
    const firstItem = page.locator('.task-item').first();
    await expect(firstItem).toHaveClass(/completed/);
  });

  test('stats bar reflects initial state', async ({ page }) => {
    const stats = page.locator('.stats');
    await expect(stats).toContainText('3');  // total
    await expect(stats).toContainText('1');  // done
    await expect(stats).toContainText('2');  // remaining
  });

  // ── Adding tasks ──────────────────────────────────────────────────────────

  test('user can add a new task', async ({ page }) => {
    await ui.addTask('Deploy to production');
    const count = await ui.getTaskCount();
    expect(count).toBe(4);
    await expect(page.locator('.task-title', { hasText: 'Deploy to production' })).toBeVisible();
  });

  test('input is cleared after adding a task', async () => {
    await ui.addTask('Test the input clears');
    await expect(ui.input).toHaveValue('');
  });

  test('new task starts as not completed', async ({ page }) => {
    await ui.addTask('Brand new task');
    const newItem = page.locator('.task-item', { hasText: 'Brand new task' });
    await expect(newItem).not.toHaveClass(/completed/);
  });

  test('submitting empty input does not add a task', async ({ page }) => {
    await ui.input.fill('');
    await ui.addBtn.click();
    const count = await ui.getTaskCount();
    expect(count).toBe(3);
  });

  test('task can be added by pressing Enter', async ({ page }) => {
    await ui.input.fill('Added via Enter key');
    await page.keyboard.press('Enter');
    await expect(page.locator('.task-title', { hasText: 'Added via Enter key' })).toBeVisible();
  });

  // ── Toggling completion ───────────────────────────────────────────────────

  test('clicking checkbox toggles a task to completed', async ({ page }) => {
    // task id=2 starts as incomplete
    await ui.toggleTask(2);
    const item = page.locator('.task-item[data-id="2"]');
    await expect(item).toHaveClass(/completed/);
  });

  test('clicking checkbox on completed task marks it incomplete', async ({ page }) => {
    // task id=1 starts as completed
    await ui.toggleTask(1);
    const item = page.locator('.task-item[data-id="1"]');
    await expect(item).not.toHaveClass(/completed/);
  });

  test('stats update after toggling a task', async ({ page }) => {
    await ui.toggleTask(2);                      // mark id=2 done
    await expect(page.locator('.stats')).toContainText('2'); // now 2 done
  });

  // ── Deleting tasks ────────────────────────────────────────────────────────

  test('user can delete a task', async ({ page }) => {
    const item = page.locator('.task-item[data-id="1"]');
    await item.hover();
    await page.getByTestId('delete-btn-1').click();
    await expect(item).not.toBeVisible();
    expect(await ui.getTaskCount()).toBe(2);
  });

  test('delete button is hidden until hover', async ({ page }) => {
    const deleteBtn = page.getByTestId('delete-btn-1');
    // opacity is 0 when not hovered — check it has 0 computed opacity
    const opacity = await deleteBtn.evaluate(el => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeLessThan(1);
  });

  test('toast notification appears after adding a task', async ({ page }) => {
    await ui.addTask('Toast test task');
    const toast = page.locator('#toast');
    await expect(toast).toHaveClass(/show/);
    await expect(toast).toContainText('Task added');
  });

  test('toast notification appears after deleting a task', async ({ page }) => {
    const item = page.locator('.task-item[data-id="1"]');
    await item.hover();
    await page.getByTestId('delete-btn-1').click();
    const toast = page.locator('#toast');
    await expect(toast).toHaveClass(/show/);
    await expect(toast).toContainText('deleted');
  });

  // ── Full workflow ─────────────────────────────────────────────────────────

  test('full workflow: add → complete → delete', async ({ page }) => {
    // 1. Add
    await ui.addTask('End-to-end workflow task');
    const allTasks = await page.request.get('/api/tasks');
    const tasks = await allTasks.json();
    const newTask = tasks.find((t: { title: string }) => t.title === 'End-to-end workflow task');
    expect(newTask).toBeTruthy();

    // 2. Toggle to complete
    await ui.toggleTask(newTask.id);
    const item = page.locator(`.task-item[data-id="${newTask.id}"]`);
    await expect(item).toHaveClass(/completed/);

    // 3. Delete
    await item.hover();
    await page.getByTestId(`delete-btn-${newTask.id}`).click();
    await expect(item).not.toBeVisible();
  });
});
