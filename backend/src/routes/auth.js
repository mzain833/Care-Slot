import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../utils/http.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  phone: z.string().trim().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Anyone registering through the public API is a patient. Doctors are created by an admin.
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    if (await User.exists({ email: req.body.email })) {
      throw new ApiError(409, 'An account with this email already exists');
    }
    const user = await User.create({ ...req.body, role: 'patient' });
    res.status(201).json({ token: signToken(user.id), user });
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    // Same message for "no such user" and "wrong password" so emails cannot be guessed.
    if (!user || !(await user.comparePassword(req.body.password))) {
      throw new ApiError(401, 'Invalid email or password');
    }
    res.json({ token: signToken(user.id), user });
  })
);

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
