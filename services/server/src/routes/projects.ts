import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';

const router = Router();

const projects = new Map<string, any>();

router.get('/', (req, res) => {
  const allProjects = [...projects.values()];
  res.json({ success: true, data: allProjects });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const project = projects.get(id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  res.json({ success: true, data: project });
});

router.post('/',
  body('name').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description } = req.body;
    const id = crypto.randomUUID();
    const project = {
      id,
      name,
      description,
      pages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    projects.set(id, project);
    res.status(201).json({ success: true, data: project });
  }
);

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const project = projects.get(id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const { name, description } = req.body;
  project.name = name || project.name;
  project.description = description || project.description;
  project.updatedAt = new Date().toISOString();
  projects.set(id, project);

  res.json({ success: true, data: project });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  if (!projects.has(id)) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  projects.delete(id);
  res.json({ success: true, message: 'Project deleted' });
});

export { router as projectsRouter };
