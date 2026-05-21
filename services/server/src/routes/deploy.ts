import { Router } from 'express';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../prisma.js';
import { requireAuth, getAuthenticatedUserId } from '../middleware/auth.js';
import {
  uploadFile,
  deleteFile,
  isStorageConfigured,
  getStorageProviderName,
  type StorageProvider
} from '../utils/oss.js';

const router = Router();
router.use(requireAuth);

const DEPLOY_DIR = process.env.DEPLOY_DIR || path.join(process.cwd(), 'deploy');

// Ensure deploy directory exists
if (!fs.existsSync(DEPLOY_DIR)) {
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });
}

// POST /api/pages/:id/deploy — 部署页面为静态文件
router.post('/pages/:id/deploy', async (req, res) => {
  const { id } = req.params;
  const userId = getAuthenticatedUserId(req);

  try {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
      res.status(404).json({ success: false, message: 'Page not found' });
      return;
    }
    if (page.createdById !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const schema = JSON.parse(page.schema);
    const pageDir = path.join(DEPLOY_DIR, id, `v${page.version}`);
    fs.mkdirSync(pageDir, { recursive: true });

    // Generate HTML file
    const title = page.title || 'Untitled Page';
    const html = generateStaticHtml(title, schema);

    // Write index.html
    const indexPath = path.join(pageDir, 'index.html');
    fs.writeFileSync(indexPath, html, 'utf-8');

    // Write schema.json for reference
    const schemaPath = path.join(pageDir, 'schema.json');
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');

    // Upload to storage
    const remotePath = `pages/${id}/v${page.version}/`;
    const storageProvider = getStorageProviderName();
    
    let deployUrl: string;
    let storageType: StorageProvider;
    
    if (isStorageConfigured()) {
      // Upload to OSS/S3
      try {
        // Upload index.html
        const indexResult = await uploadFile(indexPath, `${remotePath}index.html`);
        
        // Upload schema.json
        await uploadFile(schemaPath, `${remotePath}schema.json`);
        
        deployUrl = indexResult.url;
        storageType = indexResult.provider;
        
        console.log(`[Deploy] Uploaded to ${storageType}: ${deployUrl}`);
      } catch (uploadError: any) {
        console.error('[Deploy] OSS upload failed, falling back to local:', uploadError);
        // Fallback to local storage
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
        deployUrl = `${baseUrl}/deploy/${id}/v${page.version}/index.html`;
        storageType = 'local';
      }
    } else {
      // Use local storage
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
      deployUrl = `${baseUrl}/deploy/${id}/v${page.version}/index.html`;
      storageType = 'local';
      console.log(`[Deploy] Using local storage: ${deployUrl}`);
    }

    res.json({
      success: true,
      data: {
        pageId: id,
        version: page.version,
        url: deployUrl,
        storage: storageType,
        storageName: getStorageProviderName(),
        files: ['index.html', 'schema.json'],
      },
      message: `页面部署成功 (${getStorageProviderName()})`,
    });
  } catch (error: any) {
    console.error('Deploy error:', error);
    res.status(500).json({ success: false, message: error.message || '部署失败' });
  }
});

// GET /api/pages/:id/deployments — 获取部署历史
router.get('/pages/:id/deployments', async (req, res) => {
  const { id } = req.params;
  const userId = getAuthenticatedUserId(req);

  try {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
      res.status(404).json({ success: false, message: 'Page not found' });
      return;
    }
    if (page.createdById !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const pageDir = path.join(DEPLOY_DIR, id);
    if (!fs.existsSync(pageDir)) {
      res.json({ success: true, data: [] });
      return;
    }

    const versions = fs.readdirSync(pageDir)
      .filter(name => name.startsWith('v'))
      .map(name => {
        const version = parseInt(name.slice(1), 10);
        const indexHtml = path.join(pageDir, name, 'index.html');
        const stats = fs.statSync(indexHtml);
        
        // Determine URL based on storage type
        let url: string;
        const storageConfigured = isStorageConfigured();
        
        if (storageConfigured) {
          // For OSS/S3, construct the URL from environment config
          const baseUrl = process.env.DEPLOY_BASE_URL || process.env.BASE_URL || '';
          if (baseUrl) {
            url = `${baseUrl.replace(/\/$/, '')}/pages/${id}/${name}/index.html`;
          } else {
            // Fallback to local URL
            const serverBaseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
            url = `${serverBaseUrl}/deploy/${id}/${name}/index.html`;
          }
        } else {
          const serverBaseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
          url = `${serverBaseUrl}/deploy/${id}/${name}/index.html`;
        }
        
        return {
          version,
          url,
          deployedAt: stats.mtime.toISOString(),
          size: stats.size,
          storage: storageConfigured ? 'oss' : 'local',
          storageName: getStorageProviderName(),
        };
      })
      .sort((a, b) => b.version - a.version);

    res.json({ success: true, data: versions });
  } catch (error: any) {
    console.error('Get deployments error:', error);
    res.status(500).json({ success: false, message: error.message || '获取部署历史失败' });
  }
});

// DELETE /api/pages/:id/deployments/:version — 删除指定版本的部署
router.delete('/pages/:id/deployments/:version', async (req, res) => {
  const { id, version } = req.params;
  const userId = getAuthenticatedUserId(req);

  try {
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
      res.status(404).json({ success: false, message: 'Page not found' });
      return;
    }
    if (page.createdById !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const versionPath = `pages/${id}/v${version}/`;
    
    try {
      await deleteFile(`${versionPath}index.html`);
      await deleteFile(`${versionPath}schema.json`);
    } catch (deleteError) {
      console.log('[Deploy] Remote delete skipped (may not exist on OSS)');
    }

    // Also delete local files
    const localDir = path.join(DEPLOY_DIR, id, `v${version}`);
    if (fs.existsSync(localDir)) {
      fs.rmSync(localDir, { recursive: true });
    }

    res.json({
      success: true,
      message: `版本 v${version} 部署已删除`,
    });
  } catch (error: any) {
    console.error('Delete deployment error:', error);
    res.status(500).json({ success: false, message: error.message || '删除部署失败' });
  }
});

// Serve deployed files statically (for local storage)
const deployStatic = express.static(DEPLOY_DIR);

// GET /deploy/:pageId/:version/:file — 访问部署文件
router.get('/deploy/:pageId/:version/:file', (req, res, next) => {
  req.url = `/${req.params.pageId}/${req.params.version}/${req.params.file}`;
  deployStatic(req, res, next);
});

function generateStaticHtml(title: string, schema: any): string {
  const components = schema.page?.components || [];
  const styles = extractStyles(components);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .lc-page { min-height: 100vh; background: ${schema.page?.props?.background || '#fff'}; padding: ${schema.page?.props?.padding || 0}px; }
    ${styles}
  </style>
</head>
<body>
  <div class="lc-page" id="app">
    ${renderComponents(components)}
  </div>
  <script>
    // Page Schema (for embed / debugging)
    window.__PAGE_SCHEMA__ = ${JSON.stringify(schema)};
  </script>
</body>
</html>`;
}

function renderComponents(components: any[], level: number = 0): string {
  if (!components || !Array.isArray(components)) return '';
  return components.map(comp => renderComponent(comp, level)).join('\n');
}

function renderComponent(comp: any, level: number): string {
  if (!comp) return '';
  const tag = comp.props?.tag || 'div';
  const style = comp.props?.style || {};
  const content = comp.props?.content || comp.props?.text || '';
  const children = comp.children || [];

  const styleStr = Object.entries(style)
    .map(([k, v]) => `${cssProp(k)}: ${v}`)
    .join('; ');

  const classes = [`lc-comp`, `lc-${comp.type}`].join(' ');

  switch (comp.type) {
    case 'Text':
      return `<${comp.props?.level ? `h${comp.props.level}` : 'p'} class="${classes}" style="${styleStr}">${escapeHtml(String(content))}</${comp.props?.level ? `h${comp.props.level}` : 'p'}>`;
    case 'Button':
      return `<button class="${classes} lc-btn lc-btn-${comp.props?.type || 'default'}" style="${styleStr}">${escapeHtml(String(comp.props?.text || comp.props?.children || 'Button'))}</button>`;
    case 'Input':
      return `<input class="${classes}" type="text" placeholder="${escapeHtml(String(comp.props?.placeholder || ''))}" style="${styleStr}" />`;
    case 'Image':
      return `<img class="${classes}" src="${escapeHtml(String(comp.props?.src || ''))}" alt="${escapeHtml(String(comp.props?.alt || ''))}" style="${styleStr}" />`;
    case 'Container':
      return `<div class="${classes} lc-container" style="display: flex; flex-direction: column; ${styleStr}">${renderComponents(children, level + 1)}</div>`;
    case 'Divider':
      return `<hr class="${classes}" style="${styleStr}" />`;
    default:
      if (children.length > 0) {
        return `<div class="${classes}" style="${styleStr}">${renderComponents(children, level + 1)}</div>`;
      }
      return `<div class="${classes}" style="${styleStr}">${escapeHtml(String(content))}</div>`;
  }
}

function extractStyles(components: any[]): string {
  // Add global component styles
  const styles: string[] = [
    '.lc-container { max-width: 100%; overflow: hidden; }',
    '.lc-btn { padding: 8px 16px; border: 1px solid #d9d9d9; border-radius: 6px; cursor: pointer; font-size: 14px; }',
    '.lc-btn-primary { background: #1677ff; color: #fff; border-color: #1677ff; }',
    '.lc-btn-default { background: #fff; color: #333; }',
    '.lc-btn-dashed { border-style: dashed; }',
    '.lc-btn-text { border: none; background: transparent; }',
    'input.lc-comp { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 6px; font-size: 14px; width: 100%; }',
    'img.lc-comp { max-width: 100%; height: auto; }',
    'hr.lc-comp { border: none; border-top: 1px solid #f0f0f0; margin: 16px 0; }',
  ];
  return styles.join('\n    ');
}

function cssProp(k: string): string {
  return k.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export { router as deployRouter };
