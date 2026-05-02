/**
 * Templates routes — list/detail are public, create/update/delete require authentication
 */

import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../prisma.js';
import { requireAuth, optionalAuth, getAuthenticatedUserId } from '../middleware/auth.js';

const router = Router();

// Public: list and get templates (no auth required)
router.get('/', async (req, res) => {
  const { category, search, isPublic } = req.query;
  try {
    const where: Record<string, any> = {};
    if (category) where.category = category as string;
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        category: true,
        thumbnail: true,
        componentCount: true,
        tags: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
});

router.get('/:id',
  param('id').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const id = req.params['id']!;
    try {
      const template = await prisma.template.findUnique({ where: { id } });
      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }
      try {
        res.json({
          success: true,
          data: {
            ...template,
            schema: JSON.parse(template.schema),
            tags: JSON.parse(template.tags),
          },
        });
      } catch {
        res.status(500).json({ success: false, message: 'Invalid template data in database' });
      }
    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch template' });
    }
  }
);

// Auth required for write operations
router.use(requireAuth);

// Create template
router.post('/',
  body('name').notEmpty().withMessage('模板名称必填'),
  body('title').notEmpty().withMessage('模板标题必填'),
  body('schema').isObject().withMessage('Schema 必须是对象'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, title, description, category, schema, tags, isPublic } = req.body;
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: '认证失败' });
      return;
    }

    const componentCount = countComponents((schema as any)?.page?.components || []);

    try {
      const template = await prisma.template.create({
        data: {
          name,
          title,
          description,
          category: category || 'general',
          schema: JSON.stringify(schema),
          componentCount,
          tags: JSON.stringify(tags || []),
          isPublic: isPublic || false,
          createdById: userId,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...template,
          schema: JSON.parse(template.schema),
          tags: JSON.parse(template.tags),
        },
      });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ success: false, message: 'Failed to create template' });
    }
  }
);

// Update template
router.put('/:id',
  param('id').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const id = req.params['id']!;
    const { name, title, description, category, schema, tags, isPublic } = req.body;
    const userId = getAuthenticatedUserId(req);

    try {
      const existing = await prisma.template.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }
      if (existing.createdById !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const componentCount = schema
        ? countComponents((schema as any)?.page?.components || [])
        : existing.componentCount;

      const template = await prisma.template.update({
        where: { id },
        data: {
          name: name ?? existing.name,
          title: title ?? existing.title,
          description: description ?? existing.description,
          category: category ?? existing.category,
          schema: schema ? JSON.stringify(schema) : existing.schema,
          componentCount,
          tags: tags ? JSON.stringify(tags) : existing.tags,
          isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
        },
      });

      res.json({
        success: true,
        data: {
          ...template,
          schema: JSON.parse(template.schema),
          tags: JSON.parse(template.tags),
        },
      });
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({ success: false, message: 'Failed to update template' });
    }
  }
);

// Delete template
router.delete('/:id',
  param('id').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const id = req.params['id']!;
    const userId = getAuthenticatedUserId(req);
    try {
      const template = await prisma.template.findUnique({ where: { id } });
      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }
      if (template.createdById !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      await prisma.template.delete({ where: { id } });
      res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete template' });
    }
  }
);

// Public: get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await prisma.template.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    const result = categories.map((c) => ({
      value: c.category,
      label: getCategoryLabel(c.category),
      count: c._count.category,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

function countComponents(components: any[]): number {
  let count = 0;
  for (const comp of components) {
    count += 1;
    if (comp.children && comp.children.length > 0) {
      count += countComponents(comp.children);
    }
  }
  return count;
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    general: '通用',
    form: '表单页',
    list: '列表页',
    dashboard: '仪表盘',
    detail: '详情页',
    login: '登录页',
    landing: '落地页',
  };
  return labels[category] || category;
}

export { router as templatesRouter };
