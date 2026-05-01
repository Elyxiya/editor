import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../prisma.js';

const router = Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        pages: {
          select: {
            id: true,
            title: true,
            version: true,
            isPublished: true,
            updatedAt: true,
          },
        },
      },
    });
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            name: true,
            description: true,
            version: true,
            isPublished: true,
            createdAt: true,
            updatedAt: true,
            publishedAt: true,
          },
        },
      },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
});

// Create project
router.post('/',
  body('name').notEmpty().withMessage('项目名称必填'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description } = req.body;
    try {
      const project = await prisma.project.create({
        data: { name, description, createdById: 'default-user' },
      });
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ success: false, message: 'Failed to create project' });
    }
  }
);

// Update project
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name || project.name,
        description: description !== undefined ? description : project.description,
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.project.delete({ where: { id } });
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
});

export { router as projectsRouter };
