const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/tasksController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

const taskCreateValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required.').isLength({ max: 300 }),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done', 'overdue'])
    .withMessage('Invalid status.'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority.'),
  body('due_date').optional({ nullable: true }).isISO8601().withMessage('Invalid date format.'),
  body('project_id').optional({ nullable: true }).isInt().withMessage('Invalid project ID.'),
  body('assigned_to').optional({ nullable: true }).isInt().withMessage('Invalid user ID.'),
];

const taskUpdateValidation = [
  body('title').optional().trim().notEmpty().isLength({ max: 300 }),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done', 'overdue'])
    .withMessage('Invalid status.'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority.'),
  body('due_date').optional({ nullable: true }).isISO8601().withMessage('Invalid date format.'),
];

router.get('/', authenticate, getTasks);
router.get('/:id', authenticate, getTaskById);
router.post('/', authenticate, taskCreateValidation, createTask);
router.put('/:id', authenticate, taskUpdateValidation, updateTask);
router.delete('/:id', authenticate, requireAdmin, deleteTask);

module.exports = router;
