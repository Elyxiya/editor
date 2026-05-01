import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../prisma.js';

const router = Router();

// Get all pages
router.get('/', async (req, res) => {
  try {
    const pages = await prisma.page.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        version: true,
        isPublished: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
      },
    });
    res.json({ success: true, data: pages });
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pages' });
  }
});

// Get single page
router.get('/:id',
  param('id').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const id = req.params['id']!;
    try {
      const page = await prisma.page.findUnique({ where: { id } });
      if (!page) {
        return res.status(404).json({ success: false, message: 'Page not found' });
      }
      res.json({
        success: true,
        data: {
          ...page,
          schema: JSON.parse(page.schema),
        },
      });
    } catch (error) {
      console.error('Get page error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch page' });
    }
  }
);

// Create page
router.post('/',
  body('name').notEmpty().withMessage('页面名称必填'),
  body('title').notEmpty().withMessage('页面标题必填'),
  body('schema').isObject().withMessage('Schema 必须是对象'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, title, description, schema } = req.body;

    try {
      const page = await prisma.page.create({
        data: {
          name,
          title,
          description,
          schema: JSON.stringify(schema),
          version: 1,
          createdById: 'default-user',
        },
      });

      // Record initial version
      await prisma.pageVersion.create({
        data: {
          pageId: page.id,
          version: 1,
          schema: JSON.stringify(schema),
          createdById: 'default-user',
          comment: '初始版本',
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...page,
          schema: JSON.parse(page.schema),
        },
      });
    } catch (error) {
      console.error('Create page error:', error);
      res.status(500).json({ success: false, message: 'Failed to create page' });
    }
  }
);

// Update page (auto-save version)
router.put('/:id',
  param('id').notEmpty(),
  body('schema').isObject(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const id = req.params['id']!;
    const { schema, comment } = req.body;

    try {
      const existing = await prisma.page.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Page not found' });
      }

      const newVersion = existing.version + 1;

      const page = await prisma.page.update({
        where: { id },
        data: {
          schema: JSON.stringify(schema),
          version: newVersion,
          updatedAt: new Date(),
        },
      });

      await prisma.pageVersion.create({
        data: {
          pageId: id,
          version: newVersion,
          schema: JSON.stringify(schema),
          createdById: 'default-user',
          comment: comment || `版本 ${newVersion}`,
        },
      });

      res.json({
        success: true,
        data: {
          ...page,
          schema: JSON.parse(page.schema),
        },
      });
    } catch (error) {
      console.error('Update page error:', error);
      res.status(500).json({ success: false, message: 'Failed to update page' });
    }
  }
);

// Delete page
router.delete('/:id',
  param('id').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const id = req.params['id']!;
    try {
      await prisma.pageVersion.deleteMany({ where: { pageId: id } });
      await prisma.page.delete({ where: { id } });
      res.json({ success: true, message: 'Page deleted' });
    } catch (error) {
      console.error('Delete page error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete page' });
    }
  }
);

// Get page version history
router.get('/:id/versions', async (req, res) => {
  const id = req.params['id']!;
  try {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const versions = await prisma.pageVersion.findMany({
      where: { pageId: id },
      orderBy: { version: 'desc' },
      select: {
        version: true,
        schema: true,
        createdAt: true,
        comment: true,
      },
    });

    res.json({ success: true, data: versions });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch versions' });
  }
});

// Get specific version
router.get('/:id/versions/:version', async (req, res) => {
  const id = req.params['id']!;
  const versionStr = req.params['version']!;
  const versionNum = parseInt(versionStr, 10);

  try {
    const version = await prisma.pageVersion.findUnique({
      where: { pageId_version: { pageId: id, version: versionNum } },
    });

    if (!version) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }

    res.json({ success: true, data: version });
  } catch (error) {
    console.error('Get version error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch version' });
  }
});

// Rollback to version
router.post('/:id/rollback/:version', async (req, res) => {
  const id = req.params['id']!;
  const versionStr = req.params['version']!;
  const versionNum = parseInt(versionStr, 10);

  try {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const targetVersion = await prisma.pageVersion.findUnique({
      where: { pageId_version: { pageId: id, version: versionNum } },
    });

    if (!targetVersion) {
      return res.status(404).json({ success: false, message: 'Version not found' });
    }

    const newVersion = page.version + 1;

    const updated = await prisma.page.update({
      where: { id },
      data: {
        schema: targetVersion.schema,
        version: newVersion,
        updatedAt: new Date(),
      },
    });

    await prisma.pageVersion.create({
      data: {
        pageId: id,
        version: newVersion,
        schema: targetVersion.schema,
        createdById: 'default-user',
        comment: `回滚到 v${versionNum}`,
      },
    });

    res.json({
      success: true,
      data: {
        ...updated,
        schema: JSON.parse(updated.schema),
      },
      message: `已回滚到版本 ${versionNum}，当前版本为 ${newVersion}`,
    });
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({ success: false, message: 'Failed to rollback' });
  }
});

// Publish page
router.post('/:id/publish', async (req, res) => {
  const id = req.params['id']!;
  try {
    const page = await prisma.page.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    res.json({
      success: true,
      data: {
        ...page,
        schema: JSON.parse(page.schema),
      },
    });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish page' });
  }
});

// Unpublish page
router.post('/:id/unpublish', async (req, res) => {
  const id = req.params['id']!;
  try {
    const page = await prisma.page.update({
      where: { id },
      data: {
        isPublished: false,
        publishedAt: null,
        updatedAt: new Date(),
      },
    });
    res.json({
      success: true,
      data: {
        ...page,
        schema: JSON.parse(page.schema),
      },
    });
  } catch (error) {
    console.error('Unpublish error:', error);
    res.status(500).json({ success: false, message: 'Failed to unpublish page' });
  }
});

// Export page
router.get('/:id/export', async (req, res) => {
  const id = req.params['id']!;
  const format = (req.query['format'] as string) || 'zip';

  try {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    res.json({
      success: true,
      data: {
        pageId: page.id,
        pageName: page.name,
        pageTitle: page.title,
        version: page.version,
        format,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export page' });
  }
});

export { router as pagesRouter };
