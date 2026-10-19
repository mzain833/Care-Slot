// Pure helper functions for dates and appointment slots.
// Dates are plain "YYYY-MM-DD" strings and times are "HH:mm" strings, so they are
// easy to store, compare and test. Nothing in this file talks to the database.

export const MAX_DAYS_AHEAD = 30;
export const SLOT_LENGTHS = [15, 20, 30, 45, 60];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isValidTime = (t) => typeof t === 'string' && TIME_RE.test(t);

export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(total) {
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function isValidDateString(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** 0 = Sunday ... 6 = Saturday */
export function dayOfWeek(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

export function daysBetween(fromStr, toStr) {
  const ms = Date.parse(`${toStr}T00:00:00Z`) - Date.parse(`${fromStr}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Current date and time-of-day in the clinic's time zone, so the server's own
 * time zone (for example UTC on a cloud host) never changes which slots are open.
 */
export function getClinicNow(timeZone = process.env.CLINIC_TIMEZONE || 'Asia/Karachi', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** All slot start times in a working day, e.g. ['09:00', '09:30', ...] */
export function generateSlots({ startTime, endTime, slotMinutes }) {
  const slots = [];
  const end = timeToMinutes(endTime);
  for (let cur = timeToMinutes(startTime); cur + slotMinutes <= end; cur += slotMinutes) {
    slots.push(minutesToTime(cur));
  }
  return slots;
}

/**
 * Slots a patient can still pick: the doctor works that weekday, the slot is not
 * already booked, and (for today) the slot has not started yet.
 */
export function getAvailableSlots(doctor, dateStr, bookedTimes = [], now = getClinicNow()) {
  if (!isValidDateString(dateStr)) return [];
  if (!doctor.workingDays.includes(dayOfWeek(dateStr))) return [];
  const booked = new Set(bookedTimes);
  return generateSlots(doctor).filter((time) => {
    if (booked.has(time)) return false;
    if (dateStr === now.date && timeToMinutes(time) <= now.minutes) return false;
    return true;
  });
}

/** Returns an error message, or null if the date can be booked. */
export function validateBookableDate(dateStr, now = getClinicNow()) {
  if (!isValidDateString(dateStr)) return 'Date must be in YYYY-MM-DD format';
  const diff = daysBetween(now.date, dateStr);
  if (diff < 0) return 'You cannot book an appointment in the past';
  if (diff > MAX_DAYS_AHEAD) return `Appointments can only be booked up to ${MAX_DAYS_AHEAD} days ahead`;
  return null;
}

/** True once the appointment's start time has been reached. */
export function hasStarted(dateStr, startTime, now = getClinicNow()) {
  const diff = daysBetween(now.date, dateStr);
  if (diff < 0) return true;
  if (diff > 0) return false;
  return now.minutes >= timeToMinutes(startTime);
}
