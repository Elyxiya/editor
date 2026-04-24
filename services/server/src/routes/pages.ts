import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';

const router = Router();

const pages = new Map<string, any>();
const pageVersions = new Map<string, any[]>();

router.get('/', (req, res) => {
  const allPages = [...pages.values()];
  res.json({ success: true, data: allPages });
});

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
    const page = {
      id,
      name,
      title,
      description,
      schema,
      version: 1,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    pages.set(id, page);
    pageVersions.set(id, [{ version: 1, schema: JSON.stringify(schema), createdAt: page.createdAt }]);

    res.status(201).json({ success: true, data: page });
  }
);

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

    const versions = pageVersions.get(id) || [];
    versions.push({ version: newVersion, schema: JSON.stringify(schema), createdAt: new Date().toISOString(), comment });
    pageVersions.set(id, versions);

    page.schema = schema;
    page.version = newVersion;
    page.updatedAt = new Date().toISOString();
    pages.set(id, page);

    res.json({ success: true, data: page });
  }
);

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

router.get('/:id/versions', (req, res) => {
  const { id } = req.params;
  const versions = pageVersions.get(id) || [];
  res.json({ success: true, data: versions });
});

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

export { router as pagesRouter };
