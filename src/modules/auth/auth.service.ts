import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database';
import { User, LoginDto, JwtPayload } from './auth.types';
import refreshTokenService from './refresh-token.service';

export class AuthService {
  async login(
    dto: LoginDto,
  ): Promise<{ token: string; refreshToken: string; user: Omit<User, 'password'> } | null> {
    const result = await query<User>(
      'SELECT id, email, password, created_at FROM users WHERE email = $1',
      [dto.email],
    );

    const user = result.rows[0];
    if (!user) return null;

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) return null;

    const token = this.generateToken({ sub: user.id, email: user.email });
    const refreshToken = await refreshTokenService.generate(user.id);

    return {
      token,
      refreshToken,
      user: { id: user.id, email: user.email, created_at: user.created_at },
    };
  }

  generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const secret = process.env['JWT_SECRET'];
    if (!secret) throw new Error('JWT_SECRET is not defined');

    return jwt.sign(payload, secret, {
      expiresIn: process.env['JWT_EXPIRES_IN'] ?? '1d',
    } as jwt.SignOptions);
  }

  verifyToken(token: string): JwtPayload {
    const secret = process.env['JWT_SECRET'];
    if (!secret) throw new Error('JWT_SECRET is not defined');

    return jwt.verify(token, secret) as unknown as JwtPayload;
  }
}

export default new AuthService();
