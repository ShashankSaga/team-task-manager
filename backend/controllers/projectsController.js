const { validationResult } = require('express-validator');
const db = require('../db/db');

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        p.*,
        u.name AS created_by_name,
        COUNT(DISTINCT t.id) AS task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS completed_count,
        COUNT(DISTINCT CASE WHEN t.status = 'overdue' THEN t.id END) AS overdue_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id, u.name
       ORDER BY p.created_at DESC`
    );

    res.json({ projects: result.rows });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const projectResult = await db.query(
      `SELECT p.*, u.name AS created_by_name
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const tasksResult = await db.query(
      `SELECT
        t.*,
        a.name AS assignee_name,
        a.avatar_color AS assignee_color,
        c.name AS creator_name
       FROM tasks t
       LEFT JOIN users a ON t.assigned_to = a.id
       LEFT JOIN users c ON t.created_by = c.id
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [id]
    );

    res.json({
      project: projectResult.rows[0],
      tasks: tasksResult.rows,
    });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project.' });
  }
};

// POST /api/projects
const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color = '#6366f1' } = req.body;

    const result = await db.query(
      `INSERT INTO projects (name, description, color, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), description?.trim() || null, color, req.user.id]
    );

    res.status(201).json({
      message: 'Project created successfully.',
      project: result.rows[0],
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, color, status } = req.body;

    const existing = await db.query('SELECT id FROM projects WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const result = await db.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [name?.trim(), description?.trim(), color, status, id]
    );

    res.json({
      message: 'Project updated successfully.',
      project: result.rows[0],
    });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project.' });
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT id FROM projects WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    await db.query('DELETE FROM projects WHERE id = $1', [id]);

    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
};

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };
