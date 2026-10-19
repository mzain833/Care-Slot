import mongoose from 'mongoose';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD
    startTime: { type: String, required: true, match: TIME_RE }, // HH:mm
    reason: { type: String, trim: true, maxlength: 300, default: '' },
    status: { type: String, enum: ['booked', 'completed', 'cancelled'], default: 'booked' },
    // true while the appointment holds its slot (booked or completed), false once cancelled
    isActive: { type: Boolean, default: true },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Double-booking protection. MongoDB itself refuses a second active appointment for the
// same doctor + date + time, even if two patients click "Confirm" at the same moment.
// Cancelled appointments are left out of the index, so their slot becomes free again.
appointmentSchema.index(
  { doctor: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

// A patient cannot hold two appointments at the same time with different doctors either.
appointmentSchema.index(
  { patient: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

appointmentSchema.index({ doctor: 1, date: 1 });

export default mongoose.model('Appointment', appointmentSchema);
