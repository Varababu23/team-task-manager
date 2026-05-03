const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDB } = require('../db');

// GET /api/tasks/:id
router.get('/:id', auth, (req, res) => {
  try {
    const db = getDB();
    const task = db.prepare(`
      SELECT t.*, u.name as assigned_to_name, u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, (req, res) => {
  const { title, description, due_date, priority, status, assigned_to } = req.body;

  try {
    const db = getDB();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const memberRow = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);
    if (!memberRow) return res.status(403).json({ error: 'Not a project member' });

    // Members can only update status of tasks assigned to them
    if (memberRow.role === 'member') {
      if (task.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      }
      if (status === undefined) {
        return res.status(403).json({ error: 'Members can only update task status' });
      }
      db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
    } else {
      // Admin can update everything
      db.prepare(`
        UPDATE tasks SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          due_date = COALESCE(?, due_date),
          priority = COALESCE(?, priority),
          status = COALESCE(?, status),
          assigned_to = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title || null,
        description || null,
        due_date || null,
        priority || null,
        status || null,
        assigned_to !== undefined ? (assigned_to || null) : task.assigned_to,
        req.params.id
      );
    }

    const updated = db.prepare(`
      SELECT t.*, u.name as assigned_to_name, u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, (req, res) => {
  try {
    const db = getDB();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);
    if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
