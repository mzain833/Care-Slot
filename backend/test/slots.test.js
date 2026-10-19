import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  dayOfWeek,
  daysBetween,
  generateSlots,
  getAvailableSlots,
  getClinicNow,
  hasStarted,
  isValidDateString,
  validateBookableDate,
} from '../src/utils/slots.js';

// 2026-10-19 is a Monday, 2026-10-17 is a Saturday
const doctor = { workingDays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '11:00', slotMinutes: 30 };

test('generateSlots splits the working day into equal slots', () => {
  assert.deepEqual(generateSlots(doctor), ['09:00', '09:30', '10:00', '10:30']);
});

test('generateSlots drops a last slot that would run past closing time', () => {
  assert.deepEqual(generateSlots({ startTime: '09:00', endTime: '10:00', slotMinutes: 45 }), ['09:00']);
});

test('getAvailableSlots removes booked times', () => {
  const now = { date: '2026-10-16', minutes: 600 };
  assert.deepEqual(getAvailableSlots(doctor, '2026-10-19', ['09:30'], now), ['09:00', '10:00', '10:30']);
});

test('getAvailableSlots hides slots that already started today', () => {
  const now = { date: '2026-10-19', minutes: 9 * 60 + 45 };
  assert.deepEqual(getAvailableSlots(doctor, '2026-10-19', [], now), ['10:00', '10:30']);
});

test('getAvailableSlots returns nothing on a day the doctor does not work', () => {
  assert.equal(dayOfWeek('2026-10-17'), 6);
  assert.deepEqual(getAvailableSlots(doctor, '2026-10-17', [], { date: '2026-10-16', minutes: 0 }), []);
});

test('isValidDateString rejects impossible dates', () => {
  assert.equal(isValidDateString('2026-02-28'), true);
  assert.equal(isValidDateString('2026-02-30'), false);
  assert.equal(isValidDateString('20-10-2026'), false);
  assert.equal(isValidDateString('abc'), false);
  assert.equal(isValidDateString(undefined), false);
});

test('validateBookableDate allows today and 30 days ahead, but not the past or further', () => {
  const now = { date: '2026-10-16', minutes: 600 };
  assert.equal(validateBookableDate('2026-10-16', now), null);
  assert.equal(validateBookableDate('2026-11-15', now), null);
  assert.match(validateBookableDate('2026-10-15', now), /past/);
  assert.match(validateBookableDate('2026-11-16', now), /30 days/);
});

test('hasStarted compares date and time', () => {
  const now = { date: '2026-10-16', minutes: 10 * 60 };
  assert.equal(hasStarted('2026-10-15', '23:00', now), true);
  assert.equal(hasStarted('2026-10-16', '09:30', now), true);
  assert.equal(hasStarted('2026-10-16', '10:30', now), false);
  assert.equal(hasStarted('2026-10-17', '08:00', now), false);
});

test('addDays and daysBetween handle month and year borders', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(daysBetween('2026-10-16', '2026-11-15'), 30);
});

test('getClinicNow returns a date string and minutes since midnight', () => {
  const now = getClinicNow('Asia/Karachi', new Date('2026-10-16T20:30:00Z'));
  // 20:30 UTC is 01:30 the next day in Pakistan (UTC+5)
  assert.deepEqual(now, { date: '2026-10-17', minutes: 90 });
});
