import { randomBytes, createHash } from 'crypto';
import { query } from '../../config/database';

interface RefreshTokenRow {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

const REFRESH_TTL_DAYS = parseInt(
  (process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d').replace('d', ''),
  10,
);

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class RefreshTokenService {
  async generate(userId: number): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const hash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, hash, expiresAt],
    );

    return token;
  }

  async validate(token: string): Promise<{ userId: number } | null> {
    const hash = hashToken(token);

    const result = await query<RefreshTokenRow>(
      `SELECT id, user_id, expires_at, revoked_at
       FROM refresh_tokens
       WHERE token_hash = $1`,
      [hash],
    );

    const row = result.rows[0];
    if (!row) return null;
    if (row.revoked_at) return null;
    if (new Date(row.expires_at) < new Date()) return null;

    return { userId: row.user_id };
  }

  async rotate(oldToken: string, userId: number): Promise<string | null> {
    const hash = hashToken(oldToken);

    const revoked = await query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [hash],
    );

    if ((revoked.rowCount ?? 0) === 0) return null;

    return this.generate(userId);
  }

  async revoke(token: string): Promise<boolean> {
    const hash = hashToken(token);

    const result = await query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [hash],
    );

    return (result.rowCount ?? 0) > 0;
  }
}

export default new RefreshTokenService();
