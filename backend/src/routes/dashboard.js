const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDB } = require('../db');

// GET /api/dashboard
router.get('/', auth, (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;

    // Get all project IDs the user belongs to
    const projectRows = db.prepare(
      'SELECT project_id FROM project_members WHERE user_id = ?'
    ).all(userId);
    const projectIds = projectRows.map(r => r.project_id);

    if (projectIds.length === 0) {
      return res.json({
        totalTasks: 0,
        tasksByStatus: { todo: 0, in_progress: 0, done: 0 },
        overdueTasks: 0,
        myTasks: 0,
        tasksPerUser: [],
        recentTasks: []
      });
    }

    // Build IN clause safely
    const placeholders = projectIds.map(() => '?').join(',');

    // Total tasks
    const totalResult = db.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders})`
    ).get(...projectIds);

    // Tasks by status
    const statusRows = db.prepare(
      `SELECT status, COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders}) GROUP BY status`
    ).all(...projectIds);
    const tasksByStatus = { todo: 0, in_progress: 0, done: 0 };
    statusRows.forEach(r => { tasksByStatus[r.status] = r.count; });

    // Overdue tasks
    const overdueResult = db.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders}) AND due_date < date('now') AND status != 'done'`
    ).get(...projectIds);

    // My tasks
    const myTasksResult = db.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders}) AND assigned_to = ?`
    ).get(...projectIds, userId);

    // Tasks per user (top 5)
    const tasksPerUser = db.prepare(`
      SELECT u.name, u.id, COUNT(t.id) as task_count
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id IN (${placeholders})
      GROUP BY u.id, u.name
      ORDER BY task_count DESC
      LIMIT 5
    `).all(...projectIds);

    // Recent tasks
    const recentTasks = db.prepare(`
      SELECT t.*, u.name as assigned_to_name, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE t.project_id IN (${placeholders})
      ORDER BY t.created_at DESC
      LIMIT 5
    `).all(...projectIds);

    res.json({
      totalTasks: totalResult.count,
      tasksByStatus,
      overdueTasks: overdueResult.count,
      myTasks: myTasksResult.count,
      tasksPerUser,
      recentTasks
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
