const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDB } = require('../db');

// GET /api/projects
router.get('/', auth, (req, res) => {
  try {
    const db = getDB();
    const projects = db.prepare(`
      SELECT p.*, pm.role, u.name as creator_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      JOIN users u ON p.created_by = u.id
      WHERE pm.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects
router.post('/', auth, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  try {
    const db = getDB();
    const createProject = db.transaction(() => {
      const result = db.prepare(
        'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)'
      ).run(name.trim(), description || null, req.user.id);

      db.prepare(
        'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
      ).run(result.lastInsertRowid, req.user.id, 'admin');

      return db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    });

    const project = createProject();
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, (req, res) => {
  try {
    const db = getDB();
    const member = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Not a member of this project' });

    const project = db.prepare(`
      SELECT p.*, u.name as creator_name
      FROM projects p JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, pm.role, pm.joined_at
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(req.params.id);

    res.json({ ...project, members, currentUserRole: member.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, (req, res) => {
  const { name, description } = req.body;
  try {
    const db = getDB();
    const member = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    db.prepare(
      'UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?'
    ).run(name || null, description || null, req.params.id);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, (req, res) => {
  try {
    const db = getDB();
    const member = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/members
router.post('/:id/members', auth, (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const memberRole = role === 'admin' ? 'admin' : 'member';

  try {
    const db = getDB();
    const adminCheck = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found with that email' });

    db.prepare(`
      INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)
      ON CONFLICT(project_id, user_id) DO UPDATE SET role = excluded.role
    `).run(req.params.id, user.id, memberRole);

    res.json({ message: `${user.name} added as ${memberRole}`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', auth, (req, res) => {
  try {
    const db = getDB();
    const adminCheck = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!adminCheck || adminCheck.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    if (parseInt(req.params.userId) === req.user.id) return res.status(400).json({ error: 'Cannot remove yourself' });

    db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id/tasks
router.get('/:id/tasks', auth, (req, res) => {
  try {
    const db = getDB();
    const member = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Not a member of this project' });

    const { status, priority } = req.query;
    let sql = `
      SELECT t.*, u.name as assigned_to_name, u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.project_id = ?
    `;
    const params = [req.params.id];

    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    if (priority) { sql += ' AND t.priority = ?'; params.push(priority); }
    sql += ' ORDER BY t.created_at DESC';

    const tasks = db.prepare(sql).all(...params);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/tasks
router.post('/:id/tasks', auth, (req, res) => {
  const { title, description, due_date, priority, assigned_to } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  try {
    const db = getDB();
    const member = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Not a member of this project' });
    if (member.role !== 'admin') return res.status(403).json({ error: 'Admin access required to create tasks' });

    const result = db.prepare(`
      INSERT INTO tasks (project_id, title, description, due_date, priority, assigned_to, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, title.trim(), description || null, due_date || null, priority || 'medium', assigned_to || null, req.user.id);

    const task = db.prepare(`
      SELECT t.*, u.name as assigned_to_name, u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
