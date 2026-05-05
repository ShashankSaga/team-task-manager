const db = require('../db/db');

// GET /api/dashboard
const getDashboardStats = async (req, res) => {
  try {
    // Auto-mark overdue tasks first
    await db.query(
      `UPDATE tasks
       SET status = 'overdue'
       WHERE due_date < NOW()
         AND status NOT IN ('done', 'overdue')
         AND due_date IS NOT NULL`
    );

    // Task counts by status
    const statusCounts = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'todo') AS todo,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'done') AS done,
        COUNT(*) FILTER (WHERE status = 'overdue') AS overdue,
        COUNT(*) AS total
       FROM tasks`
    );

    // Project count
    const projectCount = await db.query('SELECT COUNT(*) AS total FROM projects');

    // User count
    const userCount = await db.query('SELECT COUNT(*) AS total FROM users');

    // Overdue tasks (up to 10)
    const overdueTasks = await db.query(
      `SELECT
        t.*,
        p.name AS project_name,
        p.color AS project_color,
        a.name AS assignee_name,
        a.avatar_color AS assignee_color
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users a ON t.assigned_to = a.id
       WHERE t.status = 'overdue'
       ORDER BY t.due_date ASC
       LIMIT 10`
    );

    // Recent tasks (last 10 created or updated)
    const recentTasks = await db.query(
      `SELECT
        t.*,
        p.name AS project_name,
        p.color AS project_color,
        a.name AS assignee_name,
        a.avatar_color AS assignee_color
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users a ON t.assigned_to = a.id
       ORDER BY t.updated_at DESC
       LIMIT 10`
    );

    // Tasks by project (for chart data)
    const tasksByProject = await db.query(
      `SELECT
        p.name AS project_name,
        p.color AS project_color,
        COUNT(t.id) AS total,
        COUNT(t.id) FILTER (WHERE t.status = 'done') AS done,
        COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress,
        COUNT(t.id) FILTER (WHERE t.status = 'overdue') AS overdue
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id, p.name, p.color
       ORDER BY total DESC
       LIMIT 6`
    );

    // My tasks (tasks assigned to the logged-in user)
    const myTasks = await db.query(
      `SELECT
        t.*,
        p.name AS project_name,
        p.color AS project_color
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = $1
         AND t.status != 'done'
       ORDER BY
         CASE t.status
           WHEN 'overdue' THEN 1
           WHEN 'in_progress' THEN 2
           WHEN 'todo' THEN 3
         END,
         t.due_date ASC NULLS LAST
       LIMIT 5`,
      [req.user.id]
    );

    res.json({
      stats: {
        ...statusCounts.rows[0],
        projects: parseInt(projectCount.rows[0].total),
        users: parseInt(userCount.rows[0].total),
      },
      overdueTasks: overdueTasks.rows,
      recentTasks: recentTasks.rows,
      tasksByProject: tasksByProject.rows,
      myTasks: myTasks.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
};

// GET /api/dashboard/users
const getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, avatar_color, created_at FROM users ORDER BY name ASC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

module.exports = { getDashboardStats, getAllUsers };
