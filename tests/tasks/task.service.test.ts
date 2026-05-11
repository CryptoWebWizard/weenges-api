import { TaskService } from '../../src/modules/tasks/task.service';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../../src/config/database';
const mockQuery = query as jest.MockedFunction<typeof query>;

const service = new TaskService();

const MOCK_TASK = {
  id: 1,
  title: 'Test Task',
  description: 'A test description',
  status: 'pending' as const,
  completed_at: null,
  deleted_at: null,
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('TaskService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns paginated tasks', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [MOCK_TASK], rowCount: 1 });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Test Task');
    });

    it('calculates totalPages correctly', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '25' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.totalPages).toBe(3);
    });
  });

  describe('findById', () => {
    it('returns task when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [MOCK_TASK], rowCount: 1 });

      const task = await service.findById(1);
      expect(task).not.toBeNull();
      expect(task!.id).toBe(1);
    });

    it('returns null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const task = await service.findById(999);
      expect(task).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a task and returns it', async () => {
      const created = { ...MOCK_TASK, title: 'New Task' };
      mockQuery.mockResolvedValueOnce({ rows: [created], rowCount: 1 });

      const task = await service.create({ title: 'New Task' });
      expect(task.title).toBe('New Task');
      expect(task.status).toBe('pending');
    });

    it('sets completed_at when status is done', async () => {
      const now = new Date();
      const created = { ...MOCK_TASK, status: 'done' as const, completed_at: now };
      mockQuery.mockResolvedValueOnce({ rows: [created], rowCount: 1 });

      const task = await service.create({ title: 'Done Task', status: 'done' });
      expect(task.completed_at).not.toBeNull();
    });
  });

  describe('update', () => {
    it('returns null when task not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.update(999, { title: 'Updated' });
      expect(result).toBeNull();
    });

    it('updates and returns the task', async () => {
      const updated = { ...MOCK_TASK, title: 'Updated Title' };
      mockQuery
        .mockResolvedValueOnce({ rows: [MOCK_TASK], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [updated], rowCount: 1 });

      const task = await service.update(1, { title: 'Updated Title' });
      expect(task!.title).toBe('Updated Title');
    });

    it('sets completed_at when status changes to done', async () => {
      const now = new Date();
      const updated = { ...MOCK_TASK, status: 'done' as const, completed_at: now };
      mockQuery
        .mockResolvedValueOnce({ rows: [MOCK_TASK], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [updated], rowCount: 1 });

      const task = await service.update(1, { status: 'done' });
      expect(task!.completed_at).not.toBeNull();
    });

    it('clears completed_at when status changes away from done', async () => {
      const doneTask = { ...MOCK_TASK, status: 'done' as const, completed_at: new Date() };
      const reverted = { ...MOCK_TASK, status: 'pending' as const, completed_at: null };
      mockQuery
        .mockResolvedValueOnce({ rows: [doneTask], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [reverted], rowCount: 1 });

      const task = await service.update(1, { status: 'pending' });
      expect(task!.completed_at).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('returns true when task exists and is deleted', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await service.softDelete(1);
      expect(result).toBe(true);
    });

    it('returns false when task does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.softDelete(999);
      expect(result).toBe(false);
    });
  });
});
