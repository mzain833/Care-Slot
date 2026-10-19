import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../utils/http.js';
import { sendMail } from '../utils/mailer.js';
import {
  getAvailableSlots,
  getClinicNow,
  hasStarted,
  isValidDateString,
  isValidTime,
  validateBookableDate,
} from '../utils/slots.js';

const router = Router();
router.use(protect);

const createSchema = z.object({
  doctorId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid doctor id'),
  date: z.string().refine(isValidDateString, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().refine(isValidTime, 'Time must be in HH:mm format'),
  reason: z.string().trim().max(300, 'Reason must be 300 characters or fewer').optional(),
});

const populateDoctor = { path: 'doctor', select: 'specialization fee user', populate: { path: 'user', select: 'name' } };

// Book an appointment (patients only)
router.post(
  '/',
  authorize('patient'),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { doctorId, date, startTime, reason = '' } = req.body;

    const doctor = await Doctor.findById(doctorId).populate('user', 'name');
    if (!doctor) throw new ApiError(404, 'Doctor not found');

    const now = getClinicNow();
    const dateError = validateBookableDate(date, now);
    if (dateError) throw new ApiError(400, dateError);

    // Is this a real slot in the doctor's schedule (right weekday, not in the past)?
    if (!getAvailableSlots(doctor, date, [], now).includes(startTime)) {
      throw new ApiError(400, 'That time is not available for this doctor');
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        patient: req.user._id,
        doctor: doctor._id,
        date,
        startTime,
        reason,
      });
    } catch (err) {
      // The unique indexes are the real guard against double booking (see models/Appointment.js).
      if (err.code === 11000) {
        throw new ApiError(
          409,
          'That slot is no longer available, or you already have an appointment at this time. Please pick another time.'
        );
      }
      throw err;
    }

    // Email is best-effort: a mail problem must never fail a booking that already succeeded.
    sendMail({
      to: req.user.email,
      subject: `Appointment confirmed with Dr. ${doctor.user.name}`,
      text:
        `Hello ${req.user.name},\n\nYour appointment is confirmed.\n\n` +
        `Doctor: Dr. ${doctor.user.name} (${doctor.specialization})\n` +
        `Date: ${date}\nTime: ${startTime}\n\n` +
        `If you cannot make it, please cancel from your appointments page so someone else can take the slot.`,
    }).catch((err) => console.error('Could not send confirmation email:', err.message));

    await appointment.populate(populateDoctor);
    res.status(201).json({ appointment });
  })
);

// Appointments of the logged-in patient, or the schedule of the logged-in doctor
router.get(
  '/mine',
  authorize('patient', 'doctor'),
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) throw new ApiError(404, 'Doctor profile not found');
      filter.doctor = doctor._id;
    }

    const appointments = await Appointment.find(filter)
      .sort({ date: 1, startTime: 1 })
      .populate(populateDoctor)
      .populate('patient', 'name email phone');
    res.json({ appointments });
  })
);

// Loads an appointment and checks that the logged-in user is allowed to touch it.
async function loadAppointment(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Appointment not found');
  const appointment = await Appointment.findById(req.params.id).populate('doctor');
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  const { user } = req;
  const isOwner = appointment.patient.equals(user._id);
  const isTheDoctor = appointment.doctor.user.equals(user._id);
  if (user.role !== 'admin' && !isOwner && !isTheDoctor) {
    throw new ApiError(403, 'You do not have permission to change this appointment');
  }
  return { appointment, isOwner, isTheDoctor };
}

router.patch(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const { appointment, isOwner } = await loadAppointment(req);

    if (appointment.status !== 'booked') {
      throw new ApiError(400, 'Only booked appointments can be cancelled');
    }
    if (req.user.role === 'patient' && isOwner && hasStarted(appointment.date, appointment.startTime)) {
      throw new ApiError(400, 'This appointment has already started and cannot be cancelled');
    }

    appointment.status = 'cancelled';
    appointment.isActive = false; // frees the slot for other patients
    appointment.cancelledBy = req.user._id;
    await appointment.save();
    res.json({ appointment });
  })
);

router.patch(
  '/:id/complete',
  authorize('doctor', 'admin'),
  asyncHandler(async (req, res) => {
    const { appointment } = await loadAppointment(req);

    if (appointment.status !== 'booked') {
      throw new ApiError(400, 'Only booked appointments can be completed');
    }
    if (!hasStarted(appointment.date, appointment.startTime)) {
      throw new ApiError(400, 'An appointment can only be completed after it has started');
    }

    appointment.status = 'completed';
    await appointment.save();
    res.json({ appointment });
  })
);

export default router;
