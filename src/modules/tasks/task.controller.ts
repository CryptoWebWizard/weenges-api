import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import taskService from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './task.types';
import { sendSuccess, sendCreated, sendError } from '../../utils/response';

export class TaskController {
  /**
   * @swagger
   * /tasks:
   *   get:
   *     summary: Get all tasks with pagination
   *     tags: [Tasks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *     responses:
   *       200:
   *         description: Paginated list of tasks
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
   *                   example: Success
   *                 data:
   *                   $ref: '#/components/schemas/PaginatedTasks'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(res, 'Validation failed', 400, errors.array());
        return;
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;

      const result = await taskService.findAll({ page, limit });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /tasks/{id}:
   *   get:
   *     summary: Get a task by ID
   *     tags: [Tasks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Task found
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
   *                   example: Success
   *                 data:
   *                   $ref: '#/components/schemas/Task'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Task not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(res, 'Validation failed', 400, errors.array());
        return;
      }

      const id = parseInt(req.params['id']);
      const task = await taskService.findById(id);

      if (!task) {
        sendError(res, `Task with id ${id} not found`, 404);
        return;
      }

      sendSuccess(res, task);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /tasks:
   *   post:
   *     summary: Create a new task
   *     tags: [Tasks]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateTaskDto'
   *     responses:
   *       201:
   *         description: Task created
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
   *                   example: Task created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Task'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(res, 'Validation failed', 400, errors.array());
        return;
      }

      const dto: CreateTaskDto = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
      };

      const task = await taskService.create(dto);
      sendCreated(res, task, 'Task created successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /tasks/{id}:
   *   patch:
   *     summary: Update a task
   *     tags: [Tasks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateTaskDto'
   *     responses:
   *       200:
   *         description: Task updated
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
   *                   example: Task updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Task'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Task not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(res, 'Validation failed', 400, errors.array());
        return;
      }

      const id = parseInt(req.params['id']);
      const dto: UpdateTaskDto = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
      };

      const task = await taskService.update(id, dto);

      if (!task) {
        sendError(res, `Task with id ${id} not found`, 404);
        return;
      }

      sendSuccess(res, task, 'Task updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /tasks/{id}:
   *   delete:
   *     summary: Soft delete a task
   *     tags: [Tasks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Task deleted
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
   *                   example: Task deleted successfully
   *                 data:
   *                   nullable: true
   *                   example: null
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Task not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(res, 'Validation failed', 400, errors.array());
        return;
      }

      const id = parseInt(req.params['id']);
      const deleted = await taskService.softDelete(id);

      if (!deleted) {
        sendError(res, `Task with id ${id} not found`, 404);
        return;
      }

      sendSuccess(res, null, 'Task deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

export default new TaskController();
