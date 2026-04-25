import { Page, expect } from '@playwright/test';

/**
 * Page Object Model for the TaskFlow UI.
 * Encapsulates all selectors and common interactions so individual
 * test files stay clean and easy to read.
 */
export class TaskPage {
  constructor(private readonly page: Page) {}

  // ── Locators ──────────────────────────────────────────────────────────────
  get input()   { return this.page.getByTestId('task-input'); }
  get addBtn()  { return this.page.getByTestId('add-btn'); }
  get taskList(){ return this.page.getByTestId('task-list'); }

  taskItem(id: number)    { return this.page.getByTestId(`task-item`).filter({ hasText: '' }).nth(0); }
  taskTitle(id: number)   { return this.page.getByTestId(`task-title-${id}`); }
  taskCheck(id: number)   { return this.page.getByTestId(`task-check-${id}`); }
  deleteBtn(id: number)   { return this.page.getByTestId(`delete-btn-${id}`); }
  allTaskItems()          { return this.page.getByTestId('task-item'); }

  // ── Actions ───────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto('/');
    await expect(this.page).toHaveTitle(/TaskFlow/);
  }

  async resetState() {
    await this.page.request.post('/api/reset');
  }

  async addTask(title: string) {
    await this.input.fill(title);
    await this.addBtn.click();
    // Wait until the new task appears in the list
    await expect(this.page.locator('.task-title', { hasText: title })).toBeVisible();
  }

  async toggleTask(id: number) {
    await this.taskCheck(id).click();
  }

  async deleteTask(id: number) {
    const item = this.page.locator(`.task-item[data-id="${id}"]`);
    await item.hover();
    await this.deleteBtn(id).click();
  }

  async getTaskCount(): Promise<number> {
    return this.allTaskItems().count();
  }
}

/** Thin wrapper around the REST API for pure-API test cases. */
export class TaskApi {
  constructor(private readonly page: Page) {}

  private get request() { return this.page.request; }

  async reset() {
    const res = await this.request.post('/api/reset');
    expect(res.status()).toBe(200);
  }

  async getAll() {
    const res = await this.request.get('/api/tasks');
    expect(res.status()).toBe(200);
    return res.json() as Promise<Array<{ id: number; title: string; completed: boolean }>>;
  }

  async create(title: string) {
    const res = await this.request.post('/api/tasks', { data: { title } });
    expect(res.status()).toBe(201);
    return res.json() as Promise<{ id: number; title: string; completed: boolean }>;
  }

  async patch(id: number, data: Partial<{ title: string; completed: boolean }>) {
    const res = await this.request.patch(`/api/tasks/${id}`, { data });
    expect(res.status()).toBe(200);
    return res.json();
  }

  async delete(id: number) {
    const res = await this.request.delete(`/api/tasks/${id}`);
    expect(res.status()).toBe(204);
  }

  async health() {
    const res = await this.request.get('/health');
    return res.json() as Promise<{ status: string; timestamp: string }>;
  }
}
