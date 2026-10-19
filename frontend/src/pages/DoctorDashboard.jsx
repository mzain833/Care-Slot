import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDate, formatTime, todayStr } from '../utils.js';

const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'all', label: 'All' },
];

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('today');
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

  const act = async (id, action) => {
    if (action === 'cancel' && !window.confirm('Cancel this appointment?')) return;
    setError('');
    try {
      await api.patch(`/appointments/${id}/${action}`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const today = todayStr();
  const visible = appointments.filter((a) => {
    if (filter === 'today') return a.date === today;
    if (filter === 'upcoming') return a.date >= today && a.status === 'booked';
    return true;
  });

  return (
    <>
      <h1>My schedule</h1>

      <div className="tabs" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={`tab ${filter === f.key ? 'tab-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && visible.length === 0 && <p className="empty muted">No appointments to show here.</p>}

      {visible.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Reason</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a._id}>
                  <td>{formatDate(a.date)}</td>
                  <td>{formatTime(a.startTime)}</td>
                  <td>
                    {a.patient.name}
                    {a.patient.phone && <div className="muted small">{a.patient.phone}</div>}
                  </td>
                  <td>{a.reason || '-'}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="actions">
                    {a.status === 'booked' && (
                      <>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => act(a._id, 'complete')}>
                          Complete
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => act(a._id, 'cancel')}>
                          Cancel
                        </button>
                      </>
                    )}
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
