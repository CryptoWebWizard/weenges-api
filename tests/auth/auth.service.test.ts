import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/modules/auth/auth.service';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../../src/config/database';
const mockQuery = query as jest.MockedFunction<typeof query>;

process.env['JWT_SECRET'] = 'test_secret';
process.env['JWT_EXPIRES_IN'] = '1d';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';

const service = new AuthService();

const DUMMY_USER = {
  id: 1,
  email: 'admin@test.com',
  password: bcrypt.hashSync('secret123', 10),
  created_at: new Date(),
};

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('returns token, refreshToken, and user on valid credentials', async () => {
      // 1st query: user SELECT; 2nd query: refresh_tokens INSERT (from generate)
      mockQuery
        .mockResolvedValueOnce({ rows: [DUMMY_USER], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await service.login({ email: 'admin@test.com', password: 'secret123' });

      expect(result).not.toBeNull();
      expect(result!.token).toBeDefined();
      expect(result!.refreshToken).toBeDefined();
      expect(result!.refreshToken).toHaveLength(64);
      expect(result!.user.email).toBe('admin@test.com');
      expect((result!.user as Record<string, unknown>)['password']).toBeUndefined();
    });

    it('returns null when user does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.login({ email: 'notfound@test.com', password: 'any' });

      expect(result).toBeNull();
    });

    it('returns null on wrong password', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [DUMMY_USER], rowCount: 1 });

      const result = await service.login({ email: 'admin@test.com', password: 'wrongpassword' });

      expect(result).toBeNull();
    });
  });

  describe('generateToken', () => {
    it('generates a valid JWT with sub and email', () => {
      const token = service.generateToken({ sub: 1, email: 'admin@test.com' });
      const decoded = jwt.verify(token, 'test_secret') as unknown as { sub: number; email: string };

      expect(decoded.sub).toBe(1);
      expect(decoded.email).toBe('admin@test.com');
    });
  });

  describe('verifyToken', () => {
    it('verifies and returns payload for a valid token', () => {
      const token = service.generateToken({ sub: 1, email: 'admin@test.com' });
      const payload = service.verifyToken(token);

      expect(payload.sub).toBe(1);
      expect(payload.email).toBe('admin@test.com');
    });

    it('throws on invalid token', () => {
      expect(() => service.verifyToken('invalid.token.here')).toThrow();
    });

    it('throws on expired token', () => {
      const token = jwt.sign({ sub: 1, email: 'a@b.com' }, 'test_secret', { expiresIn: -1 });
      expect(() => service.verifyToken(token)).toThrow();
    });
  });
});
