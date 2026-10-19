import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { addDays, formatDate, formatDays, formatTime, todayStr } from '../utils.js';

export default function BookAppointment() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [doctor, setDoctor] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState(null); // null = loading, [] = none free
  const [slot, setSlot] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const today = todayStr();
  const maxDate = addDays(today, 30);
  const canBook = !user || user.role === 'patient';

  useEffect(() => {
    api
      .get(`/doctors/${id}`)
      .then((res) => setDoctor(res.data.doctor))
      .catch((err) => setLoadError(getErrorMessage(err)));
  }, [id]);

  const loadSlots = useCallback(
    async (day) => {
      setSlots(null);
      setSlot('');
      try {
        const res = await api.get(`/doctors/${id}/slots`, { params: { date: day } });
        setSlots(res.data.slots);
      } catch (err) {
        setError(getErrorMessage(err));
        setSlots([]);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!date) return;
    setError('');
    loadSlots(date);
  }, [date, loadSlots]);

  const handleBook = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.post('/appointments', { doctorId: id, date, startTime: slot, reason });
      navigate('/appointments', { state: { booked: true } });
    } catch (err) {
      setError(getErrorMessage(err));
      // Someone else may have just taken the slot, so show fresh availability
      if (err.response?.status === 409) loadSlots(date);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <>
        <p className="alert alert-error" role="alert">{loadError}</p>
        <Link to="/">Back to doctors</Link>
      </>
    );
  }
  if (!doctor) return <p className="muted">Loading...</p>;

  return (
    <div className="booking">
      <Link to="/" className="muted back-link">
        &larr; All doctors
      </Link>

      <section className="card">
        <div className="doctor-head">
          <div className="avatar avatar-lg" aria-hidden="true">
            {doctor.user.name.charAt(0)}
          </div>
          <div>
            <h1>Dr. {doctor.user.name}</h1>
            <p className="tag">{doctor.specialization}</p>
          </div>
        </div>
        {doctor.bio && <p className="muted">{doctor.bio}</p>}
        <ul className="facts">
          <li>Fee: Rs. {doctor.fee.toLocaleString()}</li>
          <li>Works: {formatDays(doctor.workingDays)}</li>
          <li>
            Hours: {doctor.startTime} - {doctor.endTime} ({doctor.slotMinutes}-minute visits)
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>1. Choose a date</h2>
        <input
          type="date"
          value={date}
          min={today}
          max={maxDate}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Appointment date"
        />

        {date && (
          <>
            <h2>2. Choose a time</h2>
            {slots === null && <p className="muted">Checking free slots...</p>}
            {slots?.length === 0 && (
              <p className="muted">
                No free slots on {formatDate(date)}. This doctor works {formatDays(doctor.workingDays)}, so try another day.
              </p>
            )}
            {slots?.length > 0 && (
              <div className="slots" role="group" aria-label="Free time slots">
                {slots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={`slot ${slot === time ? 'slot-selected' : ''}`}
                    aria-pressed={slot === time}
                    onClick={() => setSlot(time)}
                  >
                    {formatTime(time)}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {slot && (
          <>
            <h2>3. Confirm</h2>
            <label className="form">
              Reason for visit (optional)
              <textarea
                rows={3}
                maxLength={300}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="For example: fever for two days"
              />
            </label>
            <p>
              <strong>{formatDate(date)}</strong> at <strong>{formatTime(slot)}</strong> with Dr. {doctor.user.name}
            </p>
          </>
        )}

        {!canBook && (
          <p className="alert alert-info">Only patient accounts can book appointments.</p>
        )}
        {error && <p className="alert alert-error" role="alert">{error}</p>}

        {canBook && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!slot || submitting}
            onClick={handleBook}
          >
            {submitting ? 'Booking...' : user ? 'Confirm booking' : 'Log in to book'}
          </button>
        )}
      </section>
    </div>
  );
}
