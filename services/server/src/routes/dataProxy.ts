import { Router } from 'express';
import { prisma } from '../prisma.js';
import { optionalAuth, getAuthenticatedUserId } from '../middleware/auth.js';
import { decrypt } from '../utils/encrypt.js';
import { queryData } from '../utils/dbConnector.js';

const router = Router();
router.use(optionalAuth);

// GET /api/data-proxy/:dsId/:table
router.get('/:dsId/:table', async (req, res) => {
  const { dsId, table } = req.params;
  const { page, pageSize, sortField, sortOrder, ...filters } = req.query as Record<string, string>;

  try {
    const ds = await prisma.dataSource.findUnique({ where: { id: dsId } });
    if (!ds || ds.type !== 'database') {
      res.status(404).json({ success: false, message: 'Datasource not found or not a database type' });
      return;
    }

    const config = JSON.parse(ds.config);
    const connectionConfig = {
      type: config.type as 'mysql' | 'postgresql',
      host: config.host,
      port: Number(config.port),
      database: config.database,
      user: config.user,
      password: decrypt(config.password),
    };

    const result = await queryData(connectionConfig, table, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      sortField,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      filters,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Data proxy error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to query data' });
  }
});

export { router as dataProxyRouter };
