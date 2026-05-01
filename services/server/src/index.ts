import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { pagesRouter } from './routes/pages.js';
import { projectsRouter } from './routes/projects.js';
import { templatesRouter } from './routes/templates.js';
import { initializeDatabase, disconnectDatabase } from './prisma.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/templates', templatesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

start();

export default app;
