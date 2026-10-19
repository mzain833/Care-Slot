import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
       
<Link to="/" className="brand">
  <span className="brand-mark">
    <span className="brand-cross">+</span>
  </span>
  <span className="brand-text">
    Care<span className="brand-accent">Slot</span>
  </span>
</Link>


        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end>
            Doctors
          </NavLink>
          {user?.role === 'patient' && <NavLink to="/appointments">My appointments</NavLink>}
          {user?.role === 'doctor' && <NavLink to="/doctor">My schedule</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="nav-user">
          {user ? (
            <>
              <span className="muted nav-name">{user.name}</span>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
