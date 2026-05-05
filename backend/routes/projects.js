const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectsController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required.').isLength({ max: 200 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color hex code.'),
];

const updateValidation = [
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color hex code.'),
  body('status').optional().isIn(['active', 'archived']),
];

router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProjectById);
router.post('/', authenticate, requireAdmin, projectValidation, createProject);
router.put('/:id', authenticate, requireAdmin, updateValidation, updateProject);
router.delete('/:id', authenticate, requireAdmin, deleteProject);

module.exports = router;
