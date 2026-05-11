import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import authService from './auth.service';
import refreshTokenService from './refresh-token.service';
import { sendSuccess, sendError } from '../../utils/response';

export const loginValidation = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('refreshToken is required'),
];

export class AuthController {
  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login and receive a JWT token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginDto'
   *     responses:
   *       200:
   *         description: Login successful, returns JWT
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Login successful
   *                 data:
   *                   $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(res, 'Validation failed', 400, errors.array());
        return;
      }

      const result = await authService.login({
        email: req.body.email,
        password: req.body.password,
      });

      if (!result) {
        sendError(res, 'Invalid email or password', 401);
        return;
      }

      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     summary: Exchange a refresh token for a new access token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [refreshToken]
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: New access token issued
   *       400:
   *         description: Validation error
   *       401:
   *         description: Invalid or expired refresh token
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(res, 'Validation failed', 400, errors.array());
        return;
      }

      const { refreshToken } = req.body as { refreshToken: string };
      const payload = await refreshTokenService.validate(refreshToken);

      if (!payload) {
        sendError(res, 'Invalid or expired refresh token', 401);
        return;
      }

      const newRefreshToken = await refreshTokenService.rotate(refreshToken, payload.userId);
      if (!newRefreshToken) {
        sendError(res, 'Invalid or expired refresh token', 401);
        return;
      }

      const token = authService.generateToken({ sub: payload.userId, email: '' });
      sendSuccess(res, { token, refreshToken: newRefreshToken }, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: Revoke a refresh token (logout)
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [refreshToken]
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Logged out successfully
   *       400:
   *         description: Validation error
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(res, 'Validation failed', 400, errors.array());
        return;
      }

      const { refreshToken } = req.body as { refreshToken: string };
      await refreshTokenService.revoke(refreshToken);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }
}

export default new AuthController();
