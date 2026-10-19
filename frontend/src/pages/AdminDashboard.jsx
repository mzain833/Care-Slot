import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { DAY_NAMES, formatDate, formatDays, formatTime } from '../utils.js';

const EMPTY_DOCTOR = {
  name: '',
  email: '',
  password: '',
  phone: '',
  specialization: '',
  fee: '',
  bio: '',
  workingDays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '13:00',
  slotMinutes: 30,
};

function Overview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data.stats))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <p className="alert alert-error" role="alert">{error}</p>;
  if (!stats) return <p className="muted">Loading...</p>;

  const cards = [
    ['Doctors', stats.doctors],
    ['Patients', stats.patients],
    ["Today's appointments", stats.today],
    ['Upcoming', stats.upcoming],
    ['Completed', stats.appointments.completed],
    ['Cancelled', stats.appointments.cancelled],
  ];

  return (
    <div className="stats">
      {cards.map(([label, value]) => (
        <div key={label} className="card stat">
          <div className="stat-value">{value}</div>
          <div className="muted">{label}</div>
        </div>
      ))}
    </div>
  );
}

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(EMPTY_DOCTOR);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api
      .get('/doctors')
      .then((res) => setDoctors(res.data.doctors))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleDay = (day) =>
    setForm({
      ...form,
      workingDays: form.workingDays.includes(day)
        ? form.workingDays.filter((d) => d !== day)
        : [...form.workingDays, day],
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const payload = { ...form, fee: Number(form.fee), slotMinutes: Number(form.slotMinutes) };
      if (!payload.phone) delete payload.phone;
      if (!payload.bio) delete payload.bio;
      await api.post('/admin/doctors', payload);
      setMessage(`Dr. ${form.name} was added. They can log in with the email and password you set.`);
      setForm(EMPTY_DOCTOR);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>Fee</th>
              <th>Days</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d._id}>
                <td>
                  Dr. {d.user.name}
                  <div className="muted small">{d.user.email}</div>
                </td>
                <td>{d.specialization}</td>
                <td>Rs. {d.fee.toLocaleString()}</td>
                <td>{formatDays(d.workingDays)}</td>
                <td>
                  {d.startTime} - {d.endTime} ({d.slotMinutes} min)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        <h2>Add a doctor</h2>
        <div className="form-grid">
          <label>
            Full name
            <input name="name" value={form.name} onChange={update} required minLength={2} />
          </label>
          <label>
            Email (login)
            <input type="email" name="email" value={form.email} onChange={update} required />
          </label>
          <label>
            Temporary password
            <input type="password" name="password" value={form.password} onChange={update} required minLength={8} />
          </label>
          <label>
            Phone (optional)
            <input name="phone" value={form.phone} onChange={update} />
          </label>
          <label>
            Specialization
            <input name="specialization" value={form.specialization} onChange={update} required placeholder="Cardiologist" />
          </label>
          <label>
            Fee (Rs.)
            <input type="number" min="0" name="fee" value={form.fee} onChange={update} required />
          </label>
          <label>
            Starts
            <input type="time" name="startTime" value={form.startTime} onChange={update} required />
          </label>
          <label>
            Ends
            <input type="time" name="endTime" value={form.endTime} onChange={update} required />
          </label>
          <label>
            Visit length
            <select name="slotMinutes" value={form.slotMinutes} onChange={update}>
              {[15, 20, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="days">
          <legend>Working days</legend>
          {DAY_NAMES.map((name, day) => (
            <label key={name} className="check">
              <input type="checkbox" checked={form.workingDays.includes(day)} onChange={() => toggleDay(day)} />
              {name}
            </label>
          ))}
        </fieldset>

        <label>
          Short bio (optional)
          <textarea name="bio" rows={2} maxLength={500} value={form.bio} onChange={update} />
        </label>

        {error && <p className="alert alert-error" role="alert">{error}</p>}
        {message && <p className="alert alert-success">{message}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add doctor'}
        </button>
      </form>
    </>
  );
}

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/appointments', { params: { status } })
      .then((res) => setAppointments(res.data.appointments))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <>
      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="booked">Booked</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && appointments.length === 0 && <p className="empty muted">No appointments found.</p>}

      {appointments.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Doctor</th>
                <th>Patient</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id}>
                  <td>{formatDate(a.date)}</td>
                  <td>{formatTime(a.startTime)}</td>
                  <td>Dr. {a.doctor.user.name}</td>
                  <td>{a.patient.name}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const TABS = [
  { key: 'overview', label: 'Overview', Component: Overview },
  { key: 'doctors', label: 'Doctors', Component: Doctors },
  { key: 'appointments', label: 'Appointments', Component: Appointments },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const { Component } = TABS.find((t) => t.key === tab);

  return (
    <>
      <h1>Admin dashboard</h1>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tab ${tab === t.key ? 'tab-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Component />
    </>
  );
}
