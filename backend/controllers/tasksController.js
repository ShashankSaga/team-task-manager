const { validationResult } = require('express-validator');
const db = require('../db/db');

// Helper: auto-mark overdue tasks
const checkAndMarkOverdue = async () => {
  await db.query(
    `UPDATE tasks
     SET status = 'overdue'
     WHERE due_date < NOW()
       AND status NOT IN ('done', 'overdue')
       AND due_date IS NOT NULL`
  );
};

// GET /api/tasks
const getTasks = async (req, res) => {
  try {
    await checkAndMarkOverdue();

    const { project_id, status, assigned_to, priority } = req.query;

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (project_id) {
      conditions.push(`t.project_id = $${paramIndex++}`);
      params.push(project_id);
    }
    if (status) {
      conditions.push(`t.status = $${paramIndex++}`);
      params.push(status);
    }
    if (assigned_to) {
      conditions.push(`t.assigned_to = $${paramIndex++}`);
      params.push(assigned_to);
    }
    if (priority) {
      conditions.push(`t.priority = $${paramIndex++}`);
      params.push(priority);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT
        t.*,
        p.name AS project_name,
        p.color AS project_color,
        a.name AS assignee_name,
        a.avatar_color AS assignee_color,
        c.name AS creator_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users a ON t.assigned_to = a.id
       LEFT JOIN users c ON t.created_by = c.id
       ${whereClause}
       ORDER BY
         CASE t.status
           WHEN 'overdue' THEN 1
           WHEN 'in_progress' THEN 2
           WHEN 'todo' THEN 3
           WHEN 'done' THEN 4
         END,
         t.due_date ASC NULLS LAST`,
      params
    );

    res.json({ tasks: result.rows });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    await checkAndMarkOverdue();

    const { id } = req.params;

    const result = await db.query(
      `SELECT
        t.*,
        p.name AS project_name,
        p.color AS project_color,
        a.name AS assignee_name,
        a.email AS assignee_email,
        a.avatar_color AS assignee_color,
        c.name AS creator_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users a ON t.assigned_to = a.id
       LEFT JOIN users c ON t.created_by = c.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ task: result.rows[0] });
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ error: 'Failed to fetch task.' });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      project_id,
      assigned_to,
      due_date,
      priority = 'medium',
      status = 'todo',
    } = req.body;

    // Verify project exists
    if (project_id) {
      const proj = await db.query('SELECT id FROM projects WHERE id = $1', [project_id]);
      if (proj.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found.' });
      }
    }

    // Verify assignee exists
    if (assigned_to) {
      const user = await db.query('SELECT id FROM users WHERE id = $1', [assigned_to]);
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'Assigned user not found.' });
      }
    }

    const result = await db.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, due_date, priority, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title.trim(),
        description?.trim() || null,
        project_id || null,
        assigned_to || null,
        due_date || null,
        priority,
        status,
        req.user.id,
      ]
    );

    // Fetch full task with joined data
    const fullTask = await db.query(
      `SELECT t.*, p.name AS project_name, p.color AS project_color,
              a.name AS assignee_name, a.avatar_color AS assignee_color,
              c.name AS creator_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users a ON t.assigned_to = a.id
       LEFT JOIN users c ON t.created_by = c.id
       WHERE t.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      message: 'Task created successfully.',
      task: fullTask.rows[0],
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, status, priority, assigned_to, due_date, project_id } = req.body;

    const existing = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const result = await db.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           assigned_to = COALESCE($5, assigned_to),
           due_date = COALESCE($6, due_date),
           project_id = COALESCE($7, project_id)
       WHERE id = $8
       RETURNING *`,
      [title?.trim(), description?.trim(), status, priority, assigned_to, due_date, project_id, id]
    );

    const fullTask = await db.query(
      `SELECT t.*, p.name AS project_name, p.color AS project_color,
              a.name AS assignee_name, a.avatar_color AS assignee_color,
              c.name AS creator_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users a ON t.assigned_to = a.id
       LEFT JOIN users c ON t.created_by = c.id
       WHERE t.id = $1`,
      [id]
    );

    res.json({
      message: 'Task updated successfully.',
      task: fullTask.rows[0],
    });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT id FROM tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [id]);

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
