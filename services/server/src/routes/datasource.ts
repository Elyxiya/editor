import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../prisma.js';
import { requireAuth, getAuthenticatedUserId } from '../middleware/auth.js';
import { encrypt, decrypt } from '../utils/encrypt.js';
import { testConnection, getTables, getTableSchema } from '../utils/dbConnector.js';

const router = Router();
router.use(requireAuth);

// POST /api/datasource/test-connection
router.post('/test-connection',
  body('type').isIn(['mysql', 'postgresql']),
  body('host').notEmpty(),
  body('port').isInt({ min: 1, max: 65535 }),
  body('database').notEmpty(),
  body('user').notEmpty(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { type, host, port, database, user, password } = req.body;
    const result = await testConnection({ type, host, port: Number(port), database, user, password });
    res.json({ success: result.success, message: result.message });
  }
);

// POST /api/datasource/test-connection/raw (无校验，用于向导直接测试)
router.post('/test-connection/raw', async (req, res) => {
  const { type, host, port, database, user, password } = req.body;
  if (!type || !host || !port || !database || !user) {
    res.status(400).json({ success: false, message: '缺少必填参数' });
    return;
  }
  const result = await testConnection({ type, host, port: Number(port), database, user, password });
  res.json({ success: result.success, message: result.message });
});

// GET /api/datasource/tables (直接查询，用于向导)
router.get('/tables', async (req, res) => {
  const { type, host, port, database, user, password } = req.query;
  if (!type || !host || !port || !database || !user) {
    res.status(400).json({ success: false, message: '缺少必填参数' });
    return;
  }
  try {
    const tables = await getTables({
      type: type as any, host: host as string, port: Number(port),
      database: database as string, user: user as string, password: (password as string) || '',
    });
    res.json({ success: true, data: tables });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/datasource/table-schema (直接查询，用于向导)
router.get('/table-schema', async (req, res) => {
  const { type, host, port, database, user, password, table } = req.query;
  if (!type || !host || !port || !database || !user || !table) {
    res.status(400).json({ success: false, message: '缺少必填参数' });
    return;
  }
  try {
    const columns = await getTableSchema({
      type: type as any, host: host as string, port: Number(port),
      database: database as string, user: user as string, password: (password as string) || '',
    }, table as string);
    res.json({ success: true, data: columns });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/datasource — 创建数据源
router.post('/',
  body('name').notEmpty(),
  body('type').isIn(['api', 'mock', 'variable', 'database']),
  body('config').isObject(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, type, config, pageId } = req.body;
    const userId = getAuthenticatedUserId(req);
    if (!userId) { res.status(401).json({ success: false, message: '认证失败' }); return; }

    try {
      // Encrypt database connection config
      const finalConfig = type === 'database'
        ? { ...config, password: encrypt(config.password || '') }
        : config;

      const ds = await prisma.dataSource.create({
        data: {
          name,
          type,
          config: JSON.stringify(finalConfig),
          pageId: pageId || 'global',
        },
      });
      res.status(201).json({ success: true, data: ds });
    } catch (error: any) {
      console.error('Create datasource error:', error);
      res.status(500).json({ success: false, message: 'Failed to create datasource' });
    }
  }
);

// GET /api/datasource — 列表
router.get('/', async (req, res) => {
  const { pageId } = req.query;
  const userId = getAuthenticatedUserId(req);
  try {
    const where: any = {};
    if (pageId) where.pageId = pageId;
    const list = await prisma.dataSource.findMany({ where, orderBy: { updatedAt: 'desc' } });
    const data = list.map(ds => {
      const config = JSON.parse(ds.config);
      return {
        ...ds,
        config: ds.type === 'database' ? { ...config, password: '***' } : config,
      };
    });
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Get datasources error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch datasources' });
  }
});

// GET /api/datasource/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = getAuthenticatedUserId(req);
  try {
    const ds = await prisma.dataSource.findUnique({ where: { id } });
    if (!ds) { res.status(404).json({ success: false, message: 'Datasource not found' }); return; }
    const config = JSON.parse(ds.config);
    res.json({
      success: true,
      data: { ...ds, config: ds.type === 'database' ? { ...config, password: '***' } : config },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch datasource' });
  }
});

// PUT /api/datasource/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, config } = req.body;
  try {
    const existing = await prisma.dataSource.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ success: false, message: 'Datasource not found' }); return; }

    const existingConfig = JSON.parse(existing.config);
    let finalConfig = config;
    if (existing.type === 'database' && config) {
      finalConfig = {
        ...config,
        password: config.password && config.password !== '***'
          ? encrypt(config.password)
          : existingConfig.password,
      };
    }

    const updated = await prisma.dataSource.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        config: JSON.stringify(finalConfig ?? existingConfig),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update datasource error:', error);
    res.status(500).json({ success: false, message: 'Failed to update datasource' });
  }
});

// DELETE /api/datasource/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.dataSource.delete({ where: { id } });
    res.json({ success: true, message: 'Datasource deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete datasource' });
  }
});

export { router as datasourceRouter };
