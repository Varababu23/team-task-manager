const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPrismaClient } = require('../prisma');

const prisma = getPrismaClient();

// GET /api/tasks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        creator: true
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const member = await prisma.projectMember.findFirst({
      where: {
        project_id: task.project_id,
        user_id: req.user.id
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      ...task,
      assigned_to_name: task.assignee?.name || null,
      created_by_name: task.creator?.name || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  const { title, description, due_date, priority, status, assigned_to } = req.body;

  try {
    const taskId = parseInt(req.params.id);

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const memberRow = await prisma.projectMember.findFirst({
      where: {
        project_id: task.project_id,
        user_id: req.user.id
      }
    });

    if (!memberRow) {
      return res.status(403).json({ error: 'Not a project member' });
    }

    let updated;

    if (memberRow.role === 'member') {
      if (task.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      }

      updated = await prisma.task.update({
        where: { id: taskId },
        data: {
          status,
          updated_at: new Date()
        },
        include: {
          assignee: true,
          creator: true
        }
      });
    } else {
      updated = await prisma.task.update({
        where: { id: taskId },
        data: {
          title: title || undefined,
          description: description !== undefined ? description : undefined,
          due_date: due_date !== undefined ? due_date : undefined,
          priority: priority || undefined,
          status: status || undefined,
          assigned_to: assigned_to !== undefined ? assigned_to : undefined,
          updated_at: new Date()
        },
        include: {
          assignee: true,
          creator: true
        }
      });
    }

    res.json({
      ...updated,
      assigned_to_name: updated.assignee?.name || null,
      created_by_name: updated.creator?.name || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const member = await prisma.projectMember.findFirst({
      where: {
        project_id: task.project_id,
        user_id: req.user.id,
        role: 'admin'
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;