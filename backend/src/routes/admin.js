import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../utils/http.js';
import { SLOT_LENGTHS, getClinicNow, isValidTime } from '../utils/slots.js';

const router = Router();
router.use(protect, authorize('admin'));

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const today = getClinicNow().date;
    const [doctors, patients, booked, completed, cancelled, today_, upcoming] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments({ status: 'booked' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ date: today, isActive: true }),
      Appointment.countDocuments({ status: 'booked', date: { $gte: today } }),
    ]);
    res.json({
      stats: {
        doctors,
        patients,
        appointments: { total: booked + completed + cancelled, booked, completed, cancelled },
        today: today_,
        upcoming,
      },
    });
  })
);

const timeField = z.string().refine(isValidTime, 'Time must be in HH:mm format');

const doctorSchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    phone: z.string().trim().max(20).optional(),
    specialization: z.string().trim().min(2).max(60),
    fee: z.coerce.number().min(0, 'Fee cannot be negative'),
    bio: z.string().trim().max(500).optional(),
    workingDays: z.array(z.number().int().min(0).max(6)).min(1, 'Choose at least one working day'),
    startTime: timeField,
    endTime: timeField,
    slotMinutes: z.coerce
      .number()
      .refine((n) => SLOT_LENGTHS.includes(n), `Slot length must be one of: ${SLOT_LENGTHS.join(', ')}`)
      .default(30),
  })
  .refine((d) => d.endTime > d.startTime, { message: 'End time must be after start time', path: ['endTime'] });

// Creates the login account and the doctor profile together
router.post(
  '/doctors',
  validate(doctorSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, phone, ...profile } = req.body;
    if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');

    const user = await User.create({ name, email, password, phone, role: 'doctor' });
    try {
      const doctor = await Doctor.create({ ...profile, user: user._id });
      await doctor.populate('user', 'name email phone');
      res.status(201).json({ doctor });
    } catch (err) {
      await User.findByIdAndDelete(user._id); // do not leave a doctor login without a profile
      throw err;
    }
  })
);

// All appointments, newest first. Optional filters: ?status=booked&date=2026-10-20
router.get(
  '/appointments',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (['booked', 'completed', 'cancelled'].includes(req.query.status)) filter.status = req.query.status;
    if (typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
      filter.date = req.query.date;
    }

    const appointments = await Appointment.find(filter)
      .sort({ date: -1, startTime: -1 })
      .limit(200)
      .populate({ path: 'doctor', select: 'specialization user', populate: { path: 'user', select: 'name' } })
      .populate('patient', 'name email phone');
    res.json({ appointments });
  })
);

export default router;
