import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../../src/config/database';
const mockQuery = query as jest.MockedFunction<typeof query>;

process.env['JWT_SECRET'] = 'test_secret';
process.env['JWT_EXPIRES_IN'] = '1d';

const validToken = jwt.sign({ sub: 1, email: 'admin@test.com' }, 'test_secret');

const MOCK_TASK = {
  id: 1,
  title: 'Test Task',
  description: 'Description',
  status: 'pending',
  completed_at: null,
  deleted_at: null,
  is_deleted: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const authHeader = { Authorization: `Bearer ${validToken}` };

describe('Tasks API — Integration', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── GET /api/v1/tasks ─────────────────────────────────────────────────────────

  describe('GET /api/v1/tasks', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/v1/tasks');
      expect(res.status).toBe(401);
    });

    it('returns paginated tasks with valid token', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [MOCK_TASK], rowCount: 1 });

      const res = await request(app).get('/api/v1/tasks').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
    });

    it('returns 400 on invalid page query param', async () => {
      const res = await request(app).get('/api/v1/tasks?page=abc').set(authHeader);
      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/v1/tasks/:id ─────────────────────────────────────────────────────

  describe('GET /api/v1/tasks/:id', () => {
    it('returns task when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [MOCK_TASK], rowCount: 1 });

      const res = await request(app).get('/api/v1/tasks/1').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
    });

    it('returns 404 when task not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await request(app).get('/api/v1/tasks/999').set(authHeader);

      expect(res.status).toBe(404);
    });

    it('returns 400 for non-integer id', async () => {
      const res = await request(app).get('/api/v1/tasks/abc').set(authHeader);
      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/v1/tasks ────────────────────────────────────────────────────────

  describe('POST /api/v1/tasks', () => {
    it('creates a task with valid body', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [MOCK_TASK], rowCount: 1 });

      const res = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader)
        .send({ title: 'Test Task', description: 'Description' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Test Task');
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader)
        .send({ description: 'No title here' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for invalid status value', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader)
        .send({ title: 'Task', status: 'invalid_status' });

      expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/v1/tasks').send({ title: 'Task' });

      expect(res.status).toBe(401);
    });
  });

  // ── PATCH /api/v1/tasks/:id ──────────────────────────────────────────────────

  describe('PATCH /api/v1/tasks/:id', () => {
    it('updates a task successfully', async () => {
      const updated = { ...MOCK_TASK, title: 'Updated' };
      mockQuery
        .mockResolvedValueOnce({ rows: [MOCK_TASK], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [updated], rowCount: 1 });

      const res = await request(app)
        .patch('/api/v1/tasks/1')
        .set(authHeader)
        .send({ title: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated');
    });

    it('returns 404 when task not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await request(app)
        .patch('/api/v1/tasks/999')
        .set(authHeader)
        .send({ title: 'Updated' });

      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid status', async () => {
      const res = await request(app)
        .patch('/api/v1/tasks/1')
        .set(authHeader)
        .send({ status: 'not_valid' });

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /api/v1/tasks/:id ─────────────────────────────────────────────────

  describe('DELETE /api/v1/tasks/:id', () => {
    it('soft deletes a task', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const res = await request(app).delete('/api/v1/tasks/1').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('returns 404 when task not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await request(app).delete('/api/v1/tasks/999').set(authHeader);

      expect(res.status).toBe(404);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).delete('/api/v1/tasks/1');
      expect(res.status).toBe(401);
    });
  });
});
