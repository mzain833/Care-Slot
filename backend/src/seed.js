// Fills the database with demo data: 1 admin, 3 doctors, 1 patient and a few appointments.
// Usage: npm run seed   (this DELETES existing users, doctors and appointments!)
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Doctor from './models/Doctor.js';
import Appointment from './models/Appointment.js';
import { addDays, dayOfWeek, getClinicNow } from './utils/slots.js';

if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI. Copy .env.example to .env first.');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  console.error('Refusing to wipe a production database. Pass --force if you really mean it.');
  process.exit(1);
}

await connectDB(process.env.MONGODB_URI);

await Promise.all([Appointment.deleteMany({}), Doctor.deleteMany({}), User.deleteMany({})]);
await Promise.all([User.syncIndexes(), Doctor.syncIndexes(), Appointment.syncIndexes()]);

const PASSWORDS = { admin: 'Admin@1234', doctor: 'Doctor@1234', patient: 'Patient@1234' };

await User.create({ name: 'Clinic Admin', email: 'admin@careslot.test', password: PASSWORDS.admin, role: 'admin' });
const patient = await User.create({
  name: 'Ali Raza',
  email: 'patient@careslot.test',
  password: PASSWORDS.patient,
  phone: '0300-0000000',
  role: 'patient',
});

const doctorData = [
  {
    name: 'Ayesha Khan',
    email: 'ayesha@careslot.test',
    specialization: 'Cardiologist',
    fee: 3000,
    bio: 'Heart specialist with a focus on preventive care and blood pressure management.',
    workingDays: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '13:00',
    slotMinutes: 30,
  },
  {
    name: 'Hamza Malik',
    email: 'hamza@careslot.test',
    specialization: 'General Physician',
    fee: 1500,
    bio: 'Family doctor for everyday illnesses, check-ups and vaccinations.',
    workingDays: [1, 2, 3, 4, 5, 6],
    startTime: '10:00',
    endTime: '16:00',
    slotMinutes: 20,
  },
  {
    name: 'Sana Raza',
    email: 'sana@careslot.test',
    specialization: 'Dermatologist',
    fee: 2500,
    bio: 'Skin, hair and nail care, including acne and allergy treatment.',
    workingDays: [1, 3, 5],
    startTime: '14:00',
    endTime: '18:00',
    slotMinutes: 30,
  },
];

const doctors = [];
for (const { name, email, ...profile } of doctorData) {
  const user = await User.create({ name, email, password: PASSWORDS.doctor, role: 'doctor' });
  doctors.push(await Doctor.create({ ...profile, user: user._id }));
}

// A few appointments so every dashboard has something to show
const today = getClinicNow().date;
const nextWorkingDate = (doctor) => {
  for (let i = 1; i <= 7; i += 1) {
    const date = addDays(today, i);
    if (doctor.workingDays.includes(dayOfWeek(date))) return date;
  }
  return addDays(today, 1);
};

await Appointment.create([
  // In the past and still "booked", so the doctor can try the "Complete" button
  { patient: patient._id, doctor: doctors[1]._id, date: addDays(today, -1), startTime: '10:00', reason: 'Fever and sore throat' },
  { patient: patient._id, doctor: doctors[0]._id, date: nextWorkingDate(doctors[0]), startTime: '09:30', reason: 'Routine heart check-up' },
  { patient: patient._id, doctor: doctors[2]._id, date: nextWorkingDate(doctors[2]), startTime: '14:30', reason: 'Skin allergy' },
]);

console.log('\nSeed complete. Demo logins:');
console.log(`  Admin:   admin@careslot.test   / ${PASSWORDS.admin}`);
console.log(`  Doctor:  ayesha@careslot.test  / ${PASSWORDS.doctor}   (also hamza@ and sana@)`);
console.log(`  Patient: patient@careslot.test / ${PASSWORDS.patient}\n`);

await mongoose.disconnect();
