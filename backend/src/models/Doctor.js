import mongoose from 'mongoose';
import { SLOT_LENGTHS } from '../utils/slots.js';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true, trim: true, maxlength: 60 },
    fee: { type: Number, required: true, min: 0 },
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    // 0 = Sunday ... 6 = Saturday
    workingDays: {
      type: [Number],
      validate: {
        validator: (days) =>
          days.length > 0 && days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        message: 'Working days must be numbers from 0 (Sunday) to 6 (Saturday)',
      },
    },
    startTime: { type: String, required: true, match: TIME_RE },
    endTime: { type: String, required: true, match: TIME_RE },
    slotMinutes: {
      type: Number,
      default: 30,
      validate: {
        validator: (n) => SLOT_LENGTHS.includes(n),
        message: `Slot length must be one of: ${SLOT_LENGTHS.join(', ')} minutes`,
      },
    },
  },
  { timestamps: true }
);

doctorSchema.pre('validate', function checkHours(next) {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    this.invalidate('endTime', 'End time must be after start time');
  }
  next();
});

export default mongoose.model('Doctor', doctorSchema);
