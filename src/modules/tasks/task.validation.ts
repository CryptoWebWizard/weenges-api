import { body, query, param } from 'express-validator';

export const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('title is required')
    .isLength({ max: 255 })
    .withMessage('title must be at most 255 characters'),

  body('description').optional().isString().withMessage('description must be a string'),

  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'done'])
    .withMessage('status must be pending, in_progress, or done'),
];

export const updateTaskValidation = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),

  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('title must be at most 255 characters'),

  body('description').optional().isString().withMessage('description must be a string'),

  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'done'])
    .withMessage('status must be pending, in_progress, or done'),
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
];

export const idParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
];
