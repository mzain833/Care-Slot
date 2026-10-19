
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="cs-footer">
      <div className="cs-footer-inner">
        <div className="cs-footer-brand">
          <Link to="/" className="cs-footer-logo">
            <span className="cs-footer-mark">+</span>
            <span>CareSlot</span>
          </Link>

          <p>
            Quality healthcare starts with the right connection.
            Find trusted doctors and book appointments with ease.
          </p>
        </div>

        <div className="cs-footer-links">
          <h3>Quick Links</h3>
          <Link to="/">Find Doctors</Link>
          <Link to="/login">Log In</Link>
          <Link to="/register">Create Account</Link>
        </div>

        <div className="cs-footer-links">
          <h3>For Patients</h3>
          <Link to="/appointments">My Appointments</Link>
          <Link to="/doctor">Doctor Dashboard</Link>
        </div>
      </div>

      <div className="cs-footer-bottom">
        <p>© {new Date().getFullYear()} CareSlot. All rights reserved.</p>
        <span>Healthcare, made simpler.</span>
      </div>
    </footer>
  );
}
