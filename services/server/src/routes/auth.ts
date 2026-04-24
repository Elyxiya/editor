import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lowcode-secret-key';

const users = new Map<string, { id: string; username: string; email: string; password: string; role: string }>();

router.post('/register',
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password } = req.body;

    if ([...users.values()].some(u => u.username === username || u.email === email)) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: crypto.randomUUID(), username, email, password: hashedPassword, role: 'developer' };
    users.set(user.id, user);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } } });
  }
);

router.post('/login',
  body('username').notEmpty(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;
    const user = [...users.values()].find(u => u.username === username || u.email === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } } });
  }
);

router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string };
    const user = users.get(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

export { router as authRouter };
