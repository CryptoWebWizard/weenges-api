import { Router } from 'express';
import authController, { loginValidation, refreshValidation } from './auth.controller';

const router = Router();

router.post('/login', loginValidation, authController.login.bind(authController));
router.post('/refresh', refreshValidation, authController.refresh.bind(authController));
router.post('/logout', refreshValidation, authController.logout.bind(authController));

export default router;
