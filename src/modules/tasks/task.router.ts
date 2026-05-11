import { Router } from 'express';
import taskController from './task.controller';
import {
  createTaskValidation,
  updateTaskValidation,
  paginationValidation,
  idParamValidation,
} from './task.validation';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', paginationValidation, taskController.getAll.bind(taskController));
router.get('/:id', idParamValidation, taskController.getOne.bind(taskController));
router.post('/', createTaskValidation, taskController.create.bind(taskController));
router.patch('/:id', updateTaskValidation, taskController.update.bind(taskController));
router.delete('/:id', idParamValidation, taskController.remove.bind(taskController));

export default router;
