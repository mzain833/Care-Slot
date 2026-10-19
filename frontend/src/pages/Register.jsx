import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.phone) delete payload.phone;
      await register(payload);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card auth-card">
      <h1>Create your account</h1>
      <p className="muted">Patients can book appointments with any doctor.</p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Full name
          <input name="name" value={form.name} onChange={update} required minLength={2} autoComplete="name" />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={update} required autoComplete="email" />
        </label>
        <label>
          Phone (optional)
          <input name="phone" value={form.phone} onChange={update} autoComplete="tel" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={update}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <small className="muted">At least 8 characters.</small>
        </label>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="muted">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
