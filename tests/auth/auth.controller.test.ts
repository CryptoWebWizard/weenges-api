import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../src/app';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../../src/config/database';
const mockQuery = query as jest.MockedFunction<typeof query>;

process.env['JWT_SECRET'] = 'test_secret';
process.env['JWT_EXPIRES_IN'] = '1d';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';

const DUMMY_HASH = bcrypt.hashSync('secret123', 1);

const DUMMY_USER = {
  id: 1,
  email: 'admin@test.com',
  password: DUMMY_HASH,
  created_at: new Date().toISOString(),
};

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

describe('Auth API — Integration', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── POST /api/v1/auth/login ──────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('returns 200 with token and refreshToken on valid credentials', async () => {
      // 1st query: user SELECT; 2nd query: refresh_tokens INSERT
      mockQuery
        .mockResolvedValueOnce({ rows: [DUMMY_USER], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'secret123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@test.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ password: 'secret123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com' });

      expect(res.status).toBe(400);
    });

    it('returns 401 on wrong password', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [DUMMY_USER], rowCount: 1 });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/v1/auth/refresh ────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('returns 200 with new token and refreshToken', async () => {
      // 1st query: validate SELECT; 2nd query: rotate UPDATE; 3rd query: generate INSERT
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { id: 1, user_id: 1, token_hash: 'hash', expires_at: futureDate, revoked_at: null },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'a'.repeat(64) });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('returns 400 when refreshToken is missing', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({});

      expect(res.status).toBe(400);
    });

    it('returns 401 when refreshToken is invalid', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  // ── POST /api/v1/auth/logout ─────────────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('returns 200 on successful logout', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'a'.repeat(64) });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 when refreshToken is missing', async () => {
      const res = await request(app).post('/api/v1/auth/logout').send({});

      expect(res.status).toBe(400);
    });
  });
});
