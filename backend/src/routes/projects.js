const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPrismaClient } = require('../prisma');

const prisma = getPrismaClient();

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { user_id: req.user.id },
      include: {
        project: {
          include: {
            creator: true,
            members: true,
            tasks: true,
          }
        }
      },
      orderBy: { joined_at: 'desc' }
    });

    const projects = memberships.map(m => ({
      ...m.project,
      role: m.role,
      creator_name: m.project.creator?.name || 'Unknown',
      member_count: m.project.members.length,
      task_count: m.project.tasks.length,
    }));

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description || null,
        created_by: req.user.id,
        members: {
          create: {
            user_id: req.user.id,
            role: 'admin'
          }
        }
      }
    });

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    const member = await prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: req.user.id
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this project' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: true,
        members: {
          include: { user: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const members = project.members.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joined_at: m.joined_at
    }));

    res.json({
      ...project,
      members,
      currentUserRole: member.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  const { name, description } = req.body;

  try {
    const projectId = parseInt(req.params.id);

    const member = await prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: req.user.id,
        role: 'admin'
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined
      }
    });

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    const member = await prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: req.user.id,
        role: 'admin'
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;