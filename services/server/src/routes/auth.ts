import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../prisma.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. Using insecure default for development only.');
}

const SECRET = JWT_SECRET || 'lowcode-dev-secret-do-not-use-in-production';

router.post('/register',
  body('username').isLength({ min: 3 }).withMessage('用户名至少3个字符'),
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
      });

      if (existing) {
        return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { username, email, password: hashedPassword, role: 'developer' },
      });

      const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' });
      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
    }
  }
);

router.post('/login',
  body('username').notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const user = await prisma.user.findFirst({
        where: { OR: [{ username }, { email: username }] },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }

      const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' });
      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: '登录失败，请稍后重试' });
    }
  }
);

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(auth.slice(7), SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, email: true, role: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch {
    res.status(401).json({ success: false, message: '无效的认证令牌' });
  }
});

export { router as authRouter };
