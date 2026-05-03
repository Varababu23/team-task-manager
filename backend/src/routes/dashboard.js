const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPrismaClient } = require('../prisma');

const prisma = getPrismaClient();

router.get('/', auth, async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { user_id: req.user.id },
      select: { project_id: true }
    });

    const projectIds = memberships.map(m => m.project_id);

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

    const tasks = await prisma.task.findMany({
      where: {
        project_id: { in: projectIds }
      },
      include: {
        assignee: true,
        project: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const totalTasks = tasks.length;
    const tasksByStatus = { todo: 0, in_progress: 0, done: 0 };
    let overdueTasks = 0;
    let myTasks = 0;

    tasks.forEach(task => {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;

      if (task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done') {
        overdueTasks++;
      }

      if (task.assigned_to === req.user.id) {
        myTasks++;
      }
    });

    const userTaskMap = {};

    tasks.forEach(task => {
      if (task.assignee) {
        if (!userTaskMap[task.assignee.id]) {
          userTaskMap[task.assignee.id] = {
            id: task.assignee.id,
            name: task.assignee.name,
            task_count: 0
          };
        }
        userTaskMap[task.assignee.id].task_count++;
      }
    });

    const tasksPerUser = Object.values(userTaskMap)
      .sort((a, b) => b.task_count - a.task_count)
      .slice(0, 5);

    const recentTasks = tasks.slice(0, 5).map(task => ({
      ...task,
      assigned_to_name: task.assignee?.name || null,
      project_name: task.project?.name || null
    }));

    res.json({
      totalTasks,
      tasksByStatus,
      overdueTasks,
      myTasks,
      tasksPerUser,
      recentTasks
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;