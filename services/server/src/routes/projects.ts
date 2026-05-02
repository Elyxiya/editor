/**
 * Projects routes — all operations require authentication
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../prisma.js';
import { requireAuth, getAuthenticatedUserId } from '../middleware/auth.js';

const router = Router();

// All project routes require authentication
router.use(requireAuth);

// Get all projects (owned by current user)
router.get('/', async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  try {
    const projects = await prisma.project.findMany({
      where: { createdById: userId! },
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
  const userId = getAuthenticatedUserId(req);
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
    // Only owner can view
    if (project.createdById !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
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
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: '认证失败' });
      return;
    }

    try {
      const project = await prisma.project.create({
        data: { name, description, createdById: userId },
      });
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ success: false, message: 'Failed to create project' });
    }
  }
);

// Update project
router.put('/:id',
  body('name').optional().isString(),
  body('description').optional().isString(),
  async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = getAuthenticatedUserId(req);
    try {
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      // Only owner can update
      if (project.createdById !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const updated = await prisma.project.update({
        where: { id },
        data: {
          name: name ?? project.name,
          description: description ?? project.description,
        },
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ success: false, message: 'Failed to update project' });
    }
  }
);

// Delete project
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = getAuthenticatedUserId(req);
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (project.createdById !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await prisma.project.delete({ where: { id } });
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
});

export { router as projectsRouter };
