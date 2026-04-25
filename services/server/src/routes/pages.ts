import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// 页面数据存储
const pages = new Map<string, any>();
// 版本历史存储
const pageVersions = new Map<string, any[]>();

// 获取所有页面
router.get('/', (req, res) => {
  const allPages = [...pages.values()];
  res.json({ success: true, data: allPages });
});

// 获取单个页面
router.get('/:id',
  param('id').notEmpty(),
  (req, res) => {
    const { id } = req.params;
    const page = pages.get(id);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    res.json({ success: true, data: page });
  }
);

// 创建页面
router.post('/',
  body('name').notEmpty(),
  body('title').notEmpty(),
  body('schema').isObject(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, title, description, schema } = req.body;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const page = {
      id,
      name,
      title,
      description,
      schema,
      version: 1,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };

    pages.set(id, page);
    // 记录初始版本
    pageVersions.set(id, [{
      version: 1,
      schema: JSON.stringify(schema),
      createdAt: now,
      comment: '初始版本'
    }]);

    res.status(201).json({ success: true, data: page });
  }
);

// 更新页面（保存版本）
router.put('/:id',
  param('id').notEmpty(),
  body('schema').isObject(),
  (req, res) => {
    const { id } = req.params;
    const page = pages.get(id);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const { schema, comment } = req.body;
    const newVersion = page.version + 1;
    const now = new Date().toISOString();

    // 保存版本历史
    const versions = pageVersions.get(id) || [];
    versions.push({
      version: newVersion,
      schema: JSON.stringify(schema),
      createdAt: now,
      comment: comment || `版本 ${newVersion}`
    });
    pageVersions.set(id, versions);

    // 更新页面
    page.schema = schema;
    page.version = newVersion;
    page.updatedAt = now;
    pages.set(id, page);

    res.json({ success: true, data: page });
  }
);

// 删除页面
router.delete('/:id',
  param('id').notEmpty(),
  (req, res) => {
    const { id } = req.params;
    if (!pages.has(id)) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    pages.delete(id);
    pageVersions.delete(id);
    res.json({ success: true, message: 'Page deleted' });
  }
);

// 获取页面版本历史
router.get('/:id/versions', (req, res) => {
  const { id } = req.params;
  const page = pages.get(id);
  if (!page) {
    return res.status(404).json({ success: false, message: 'Page not found' });
  }
  const versions = pageVersions.get(id) || [];
  res.json({ success: true, data: versions });
});

// 获取指定版本详情
router.get('/:id/versions/:version', (req, res) => {
  const { id, version: versionStr } = req.params;
  const versionNum = parseInt(versionStr, 10);
  
  const versions = pageVersions.get(id) || [];
  const targetVersion = versions.find((v: any) => v.version === versionNum);
  
  if (!targetVersion) {
    return res.status(404).json({ success: false, message: 'Version not found' });
  }
  
  res.json({ success: true, data: targetVersion });
});

// 回滚到指定版本
router.post('/:id/rollback/:version', (req, res) => {
  const { id, version: versionStr } = req.params;
  const versionNum = parseInt(versionStr, 10);
  
  const page = pages.get(id);
  if (!page) {
    return res.status(404).json({ success: false, message: 'Page not found' });
  }
  
  const versions = pageVersions.get(id) || [];
  const targetVersion = versions.find((v: any) => v.version === versionNum);
  
  if (!targetVersion) {
    return res.status(404).json({ success: false, message: 'Version not found' });
  }
  
  const now = new Date().toISOString();
  const newVersion = page.version + 1;
  
  // 保存当前版本到历史（回滚前状态）
  versions.push({
    version: newVersion,
    schema: JSON.stringify(page.schema),
    createdAt: now,
    comment: `回滚前版本（v${newVersion - 1}）`
  });
  pageVersions.set(id, versions);
  
  // 执行回滚
  page.schema = JSON.parse(targetVersion.schema);
  page.version = newVersion;
  page.updatedAt = now;
  pages.set(id, page);
  
  res.json({
    success: true,
    data: page,
    message: `已回滚到版本 ${versionNum}，当前版本为 ${newVersion}`
  });
});

// 发布页面
router.post('/:id/publish', (req, res) => {
  const { id } = req.params;
  const page = pages.get(id);
  if (!page) {
    return res.status(404).json({ success: false, message: 'Page not found' });
  }

  page.isPublished = true;
  page.publishedAt = new Date().toISOString();
  pages.set(id, page);

  res.json({ success: true, data: page });
});

// 取消发布页面
router.post('/:id/unpublish', (req, res) => {
  const { id } = req.params;
  const page = pages.get(id);
  if (!page) {
    return res.status(404).json({ success: false, message: 'Page not found' });
  }

  page.isPublished = false;
  page.publishedAt = null;
  pages.set(id, page);

  res.json({ success: true, data: page });
});

// 导出页面代码
router.get('/:id/export', async (req, res) => {
  const { id } = req.params;
  const { format = 'zip' } = req.query;
  
  const page = pages.get(id);
  if (!page) {
    return res.status(404).json({ success: false, message: 'Page not found' });
  }
  
  // 返回导出的元信息，实际代码生成在前端完成
  res.json({
    success: true,
    data: {
      pageId: page.id,
      pageName: page.name,
      pageTitle: page.title,
      version: page.version,
      format,
      generatedAt: new Date().toISOString()
    }
  });
});

export { router as pagesRouter };
