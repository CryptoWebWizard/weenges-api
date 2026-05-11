import { RefreshTokenService } from '../../src/modules/auth/refresh-token.service';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../../src/config/database';
const mockQuery = query as jest.MockedFunction<typeof query>;

process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';

const service = new RefreshTokenService();

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const pastDate = new Date(Date.now() - 1000);

describe('RefreshTokenService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('generate', () => {
    it('inserts a token record and returns a 64-char hex string', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const token = await service.generate(1);

      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('validate', () => {
    it('returns userId for a valid non-expired non-revoked token', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1, token_hash: 'hash', expires_at: futureDate, revoked_at: null }],
        rowCount: 1,
      });

      const result = await service.validate('some-token');

      expect(result).not.toBeNull();
      expect(result!.userId).toBe(1);
    });

    it('returns null when token is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.validate('unknown-token');

      expect(result).toBeNull();
    });

    it('returns null when token is revoked', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, user_id: 1, token_hash: 'hash', expires_at: futureDate, revoked_at: new Date() },
        ],
        rowCount: 1,
      });

      const result = await service.validate('revoked-token');

      expect(result).toBeNull();
    });

    it('returns null when token is expired', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1, token_hash: 'hash', expires_at: pastDate, revoked_at: null }],
        rowCount: 1,
      });

      const result = await service.validate('expired-token');

      expect(result).toBeNull();
    });
  });

  describe('rotate', () => {
    it('revokes old token and returns a new 64-char hex token', async () => {
      // 1st query: UPDATE revoke old token; 2nd query: INSERT new token (from generate)
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const newToken = await service.rotate('old-token', 1);

      expect(newToken).not.toBeNull();
      expect(newToken).toHaveLength(64);
    });

    it('returns null when old token is invalid or already revoked', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.rotate('bad-token', 1);

      expect(result).toBeNull();
    });
  });

  describe('revoke', () => {
    it('returns true when token is found and revoked', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await service.revoke('valid-token');

      expect(result).toBe(true);
    });

    it('returns false when token is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.revoke('missing-token');

      expect(result).toBe(false);
    });
  });
});
