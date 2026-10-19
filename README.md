# CareSlot - Clinic Appointment Booking System

A full-stack MERN app where patients find a doctor, pick a free time slot and book an appointment online. Doctors manage their daily schedule and admins manage doctors and see clinic statistics.

Built as a portfolio project to show real-world skills: authentication, role-based access, data modelling, a real concurrency problem (double booking) and a clean REST API.

**Live demo:** _add your Vercel link here_ &nbsp;|&nbsp; **API:** _add your Render link here_

## Features

**Patients**
- Register and log in (JWT)
- Search doctors by name or specialty
- See only the time slots that are actually free for a chosen date
- Book, view and cancel appointments; get a confirmation email

**Doctors**
- Own schedule view: Today / Upcoming / All
- Mark an appointment as completed or cancel it

**Admin**
- Dashboard with clinic statistics
- Add doctors (creates their login and working hours in one step)
- See every appointment, filter by status

**Backend quality**
- Double booking is impossible, even when two patients click at the same moment (see below)
- Role-based access control: patient, doctor, admin
- Request validation with zod, central error handling, rate limiting on login, helmet and CORS
- Slot logic is pure functions with unit tests

## Tech stack

| Layer    | Tools |
| -------- | ----- |
| Frontend | React 18, React Router 6, Axios, Vite, plain CSS |
| Backend  | Node.js, Express 4, Mongoose 8, JWT, bcryptjs, zod, nodemailer |
| Database | MongoDB |
| Tests    | Node's built-in test runner (`node --test`) |

## Demo accounts (after `npm run seed`)

| Role    | Email                  | Password     |
| ------- | ---------------------- | ------------ |
| Admin   | admin@careslot.test    | Admin@1234   |
| Doctor  | ayesha@careslot.test   | Doctor@1234  |
| Patient | patient@careslot.test  | Patient@1234 |

(Doctors `hamza@careslot.test` and `sana@careslot.test` use the same doctor password.)

## Run it locally

You need Node.js 18+ and MongoDB (local install, Docker, or a free MongoDB Atlas cluster).

```bash
# 1. MongoDB (skip if you already have one or use Atlas)
docker compose up -d

# 2. API
cd backend
cp .env.example .env        # then edit JWT_SECRET (and MONGODB_URI if not local)
npm install
npm run seed                # demo data
npm run dev                 # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Run the unit tests: `cd server && npm test`

## How double booking is prevented

Checking "is this slot free?" and then saving is not safe on its own: two patients can both pass the check before either one saves. CareSlot lets MongoDB make the final decision with a **unique partial index**:

```js
appointmentSchema.index(
  { doctor: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
```

- Only one active appointment can exist for a doctor, date and time.
- Cancelling sets `isActive: false`, which removes the appointment from the index and frees the slot.
- If the second patient loses the race, the API returns `409 Conflict` and the UI reloads the free slots.
- A second index stops one patient from booking two doctors at the same time.

## Project structure

```
careslot/
  server/
    src/
      app.js, index.js, seed.js
      config/        database connection
      models/        User, Doctor, Appointment
      middleware/    auth (JWT + roles), validation, error handling
      routes/        auth, doctors, appointments, admin
      utils/         slots (dates and slot logic), mailer, http helpers
    test/            unit tests for the slot logic
  client/
    src/
      pages/         Doctors, BookAppointment, MyAppointments, DoctorDashboard, AdminDashboard, Login, Register
      components/    Navbar, ProtectedRoute, StatusBadge
      context/       AuthContext
```

## API overview

| Method | Endpoint | Access | Purpose |
| ------ | -------- | ------ | ------- |
| POST | `/api/auth/register` | public | Create a patient account |
| POST | `/api/auth/login` | public | Log in, returns a JWT |
| GET | `/api/auth/me` | logged in | Current user |
| GET | `/api/doctors?search=&specialization=` | public | List doctors |
| GET | `/api/doctors/specializations` | public | Specialties for the filter |
| GET | `/api/doctors/:id` | public | One doctor |
| GET | `/api/doctors/:id/slots?date=YYYY-MM-DD` | public | Free slots for a date |
| POST | `/api/appointments` | patient | Book a slot |
| GET | `/api/appointments/mine` | patient, doctor | Own appointments / own schedule |
| PATCH | `/api/appointments/:id/cancel` | patient, doctor, admin | Cancel (frees the slot) |
| PATCH | `/api/appointments/:id/complete` | doctor, admin | Mark as completed |
| GET | `/api/admin/stats` | admin | Dashboard numbers |
| POST | `/api/admin/doctors` | admin | Create a doctor |
| GET | `/api/admin/appointments?status=` | admin | All appointments |

## Deploy for free

1. **Database:** create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas), allow access from anywhere (`0.0.0.0/0`) and copy the connection string.
2. **API on Render:** New > Web Service > connect your GitHub repo. Root directory `server`, build command `npm install`, start command `npm start`. Add environment variables: `MONGODB_URI`, `JWT_SECRET` (long random text), `CLIENT_URL` (your Vercel URL), `NODE_ENV=production`. A `render.yaml` is included.
3. **Seed once:** from your own computer run `npm run seed -- --force` with `MONGODB_URI` pointing at Atlas, or add an admin by hand.
4. **Frontend on Vercel:** import the repo, root directory `client`, framework Vite. Add `VITE_API_URL=https://<your-api>.onrender.com/api`. `vercel.json` already handles page refreshes on routes like `/appointments`.
5. Put both live links at the top of this README and in your CV.

Render's free tier sleeps after inactivity, so the first request can take around 30 seconds. Mention this in your email or open the link once before an interview.

## Limitations and ideas for next steps

These are good talking points in an interview, and they are honest about where the project stops:

- Single clinic and a single time zone (`CLINIC_TIMEZONE`).
- No pagination on lists yet (fine for a small clinic).
- No password reset or email verification.
- Doctor search filters in memory; at larger scale it would use a database text index.
- No end-to-end or API integration tests yet; only the slot logic has unit tests. Adding Supertest + an in-memory MongoDB would be the next step.
- Possible features: rescheduling, reminders (cron), doctor days off, payments, an AI assistant that summarises visit notes.

## Presenting it on your CV

Short version you can adapt (keep it true to what you can explain):

- **CareSlot - Clinic Appointment Booking (MERN)** | React, Node.js, Express, MongoDB, JWT
  - Built a full-stack booking system with patient, doctor and admin roles using JWT and role-based access control.
  - Prevented double booking with a unique partial index in MongoDB, with 409 handling and live slot refresh in the UI.
  - Wrote slot-generation logic as pure functions with unit tests; deployed on Vercel, Render and MongoDB Atlas.
