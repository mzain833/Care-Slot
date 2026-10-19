import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { getErrorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDate, formatTime, todayStr } from '../utils.js';

function AppointmentCard({ appointment, onCancel }) {
  const { doctor } = appointment;
  return (
    <article className="card appt">
      <div>
        <h3>Dr. {doctor.user.name}</h3>
        <p className="tag">{doctor.specialization}</p>
        <p>
          {formatDate(appointment.date)} at {formatTime(appointment.startTime)}
        </p>
        {appointment.reason && <p className="muted">Reason: {appointment.reason}</p>}
      </div>
      <div className="appt-side">
        <StatusBadge status={appointment.status} />
        {onCancel && (
          <button type="button" className="btn btn-danger" onClick={() => onCancel(appointment._id)}>
            Cancel
          </button>
        )}
      </div>
    </article>
  );
}

export default function MyAppointments() {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/appointments/mine');
      setAppointments(res.data.appointments);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment? The time slot will be freed for other patients.')) return;
    setError('');
    try {
      await api.patch(`/appointments/${id}/cancel`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const today = todayStr();
  const upcoming = appointments.filter((a) => a.status === 'booked' && a.date >= today);
  const history = appointments.filter((a) => !upcoming.includes(a)).reverse();

  return (
    <>
      <h1>My appointments</h1>
      {location.state?.booked && (
        <p className="alert alert-success">Your appointment is booked. A confirmation email is on its way.</p>
      )}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {loading && <p className="muted">Loading...</p>}

      {!loading && (
        <>
          <h2>Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="empty muted">
              You have no upcoming appointments. <Link to="/">Find a doctor</Link>
            </p>
          ) : (
            upcoming.map((a) => <AppointmentCard key={a._id} appointment={a} onCancel={handleCancel} />)
          )}

          {history.length > 0 && (
            <>
              <h2>History</h2>
              {history.map((a) => (
                <AppointmentCard key={a._id} appointment={a} />
              ))}
            </>
          )}
        </>
      )}
    </>
  );
}
