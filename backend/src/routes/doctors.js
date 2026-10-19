import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import { validate } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../utils/http.js';
import {
  getAvailableSlots,
  getClinicNow,
  isValidDateString,
  validateBookableDate,
} from '../utils/slots.js';

const router = Router();

// Public: list doctors, optionally filtered by ?search= (name or specialization) and ?specialization=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const search = String(req.query.search || '').trim().toLowerCase();
    const specialization = String(req.query.specialization || '').trim();

    const filter = specialization ? { specialization } : {};
    let doctors = await Doctor.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: 1 })
      .lean();

    // Doctor names live on the User document, so the text search is done here.
    // A clinic has tens of doctors, not millions, so this is plenty fast.
    if (search) {
      doctors = doctors.filter(
        (d) =>
          d.user?.name.toLowerCase().includes(search) ||
          d.specialization.toLowerCase().includes(search)
      );
    }
    res.json({ doctors });
  })
);

router.get(
  '/specializations',
  asyncHandler(async (req, res) => {
    const specializations = (await Doctor.distinct('specialization')).sort();
    res.json({ specializations });
  })
);

async function findDoctor(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Doctor not found');
  const doctor = await Doctor.findById(id).populate('user', 'name email phone');
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  return doctor;
}

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json({ doctor: await findDoctor(req.params.id) });
  })
);

const slotsQuery = z.object({
  date: z.string().refine(isValidDateString, 'Date must be in YYYY-MM-DD format'),
});

// Free slots for one doctor on one date
router.get(
  '/:id/slots',
  validate(slotsQuery, 'query'),
  asyncHandler(async (req, res) => {
    const doctor = await findDoctor(req.params.id);
    const { date } = req.query;
    const now = getClinicNow();

    const dateError = validateBookableDate(date, now);
    if (dateError) throw new ApiError(400, dateError);

    const bookedTimes = await Appointment.distinct('startTime', {
      doctor: doctor._id,
      date,
      isActive: true,
    });
    res.json({ date, slots: getAvailableSlots(doctor, date, bookedTimes, now) });
  })
);

export default router;
