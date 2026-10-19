// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import api, { getErrorMessage } from '../api.js';
// import { formatDays } from '../utils.js';

// export default function Doctors() {
//   const [doctors, setDoctors] = useState([]);
//   const [specializations, setSpecializations] = useState([]);
//   const [search, setSearch] = useState('');
//   const [specialization, setSpecialization] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     api
//       .get('/doctors/specializations')
//       .then((res) => setSpecializations(res.data.specializations))
//       .catch(() => {}); // the filter is optional, so a failure here is not worth an error banner
//   }, []);

//   // Wait 300 ms after the last keystroke before asking the server
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setLoading(true);
//       setError('');
//       api
//         .get('/doctors', { params: { search, specialization } })
//         .then((res) => setDoctors(res.data.doctors))
//         .catch((err) => setError(getErrorMessage(err)))
//         .finally(() => setLoading(false));
//     }, 300);
//     return () => clearTimeout(timer);
//   }, [search, specialization]);

//   return (
//     <>
//       <section className="hero">
//         <h1>Book a doctor in a minute</h1>
//         <p className="muted">Pick a specialist, choose a free time slot and get a confirmation. No phone calls.</p>
//       </section>

//       <div className="filters">
//         <input
//           type="search"
//           placeholder="Search by doctor name or specialty"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           aria-label="Search doctors"
//         />
//         <select
//           value={specialization}
//           onChange={(e) => setSpecialization(e.target.value)}
//           aria-label="Filter by specialization"
//         >
//           <option value="">All specialties</option>
//           {specializations.map((s) => (
//             <option key={s} value={s}>
//               {s}
//             </option>
//           ))}
//         </select>
//       </div>

//       {error && <p className="alert alert-error" role="alert">{error}</p>}
//       {loading && <p className="muted">Loading doctors...</p>}
//       {!loading && !error && doctors.length === 0 && (
//         <p className="empty muted">No doctors match your search.</p>
//       )}

//       <div className="grid">
//         {doctors.map((doctor) => (
//           <article key={doctor._id} className="card doctor-card">
//             <div className="avatar" aria-hidden="true">
//               {doctor.user.name.charAt(0)}
//             </div>
//             <h2>Dr. {doctor.user.name}</h2>
//             <p className="tag">{doctor.specialization}</p>
//             {doctor.bio && <p className="muted">{doctor.bio}</p>}
//             <ul className="facts">
//               <li>Fee: Rs. {doctor.fee.toLocaleString()}</li>
//               <li>Days: {formatDays(doctor.workingDays)}</li>
//               <li>
//                 Hours: {doctor.startTime} - {doctor.endTime}
//               </li>
//             </ul>
//             <Link to={`/doctors/${doctor._id}`} className="btn btn-primary">
//               Book appointment
//             </Link>
//           </article>
//         ))}
//       </div>
//     </>
//   );
// }




import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api.js';
import { formatDays } from '../utils.js';
import './Doctors.css';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/doctors/specializations')
      .then((res) => setSpecializations(res.data.specializations))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');

      api
        .get('/doctors', { params: { search, specialization } })
        .then((res) => setDoctors(res.data.doctors))
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [search, specialization]);

  const clearFilters = () => {
    setSearch('');
    setSpecialization('');
  };

  return (
    <div className="doctors-page">
      <section className="doctors-hero">
        <div className="doctors-hero-content">
          <div className="doctors-eyebrow">
            <span className="doctors-eyebrow-dot" />
            YOUR HEALTH, YOUR PRIORITY
          </div>

          <h1>
            Find the right doctor.
            <br />
            <span>Feel better, sooner.</span>
          </h1>

          <p className="doctors-hero-description">
            Connect with trusted healthcare professionals and book
            an appointment that fits your schedule.
          </p>

          <div className="doctors-benefits">
            <span>
              <span className="benefit-check">✓</span>
              Easy booking
            </span>
            <span>
              <span className="benefit-check">✓</span>
              Choose your time
            </span>
            <span>
              <span className="benefit-check">✓</span>
              Email confirmation
            </span>
          </div>
        </div>

        <div className="doctors-hero-art" aria-hidden="true">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />

          <div className="hero-medical-symbol">
            <span>+</span>
          </div>

          <div className="hero-floating-card hero-card-top">
            <span className="hero-floating-icon">✓</span>
            <span>
              <strong>Simple booking</strong>
              <small>Just a few steps</small>
            </span>
          </div>

          <div className="hero-floating-card hero-card-bottom">
            <span className="hero-calendar-icon">▦</span>
            <span>
              <strong>Your schedule</strong>
              <small>Choose a suitable slot</small>
            </span>
          </div>
        </div>
      </section>

      <section className="doctor-search-section">
        <div className="doctor-search-heading">
          <div>
            <span className="section-eyebrow">START YOUR SEARCH</span>
            <h2>Find your specialist</h2>
            <p>Search by name or choose a medical specialty.</p>
          </div>

          <div className="search-section-icon" aria-hidden="true">
            <span>⌕</span>
          </div>
        </div>

        <div className="doctor-search-controls">
          <label className="doctor-search-field">
            <span className="search-field-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Doctor name or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search doctors by name or specialty"
            />
            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>

          <label className="doctor-specialty-field">
            <span className="specialty-label">SPECIALTY</span>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              aria-label="Filter by specialization"
            >
              <option value="">All specialties</option>
              {specializations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          {(search || specialization) && (
            <button
              type="button"
              className="clear-filters-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {specializations.length > 0 && (
          <div className="specialty-quick-filters">
            <span className="quick-filter-label">Popular specialties</span>
            <div className="specialty-chips">
              <button
                type="button"
                className={`specialty-chip ${!specialization ? 'selected' : ''}`}
                onClick={() => setSpecialization('')}
              >
                All
              </button>

              {specializations.slice(0, 5).map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`specialty-chip ${specialization === s ? 'selected' : ''}`}
                  onClick={() => setSpecialization(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="doctor-results-section">
        <div className="doctor-results-heading">
          <div>
            <span className="section-eyebrow">YOUR CARE OPTIONS</span>
            <h2>Meet our doctors</h2>
          </div>

          {!loading && !error && (
            <span className="doctor-results-count">
              {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} found
            </span>
          )}
        </div>

        {error && (
          <div className="doctors-message doctors-error" role="alert">
            <strong>We couldn't load the doctors.</strong>
            <p>{error}</p>
            <button
              type="button"
              className="doctors-retry-button"
              onClick={() => {
                setSearch((current) => current);
                setSpecialization((current) => current);
                setLoading(true);
                setError('');
                api
                  .get('/doctors', { params: { search, specialization } })
                  .then((res) => setDoctors(res.data.doctors))
                  .catch((err) => setError(getErrorMessage(err)))
                  .finally(() => setLoading(false));
              }}
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="doctors-grid" aria-label="Loading doctors">
            {[1, 2, 3].map((item) => (
              <div className="doctor-skeleton" key={item}>
                <div className="skeleton-header">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-lines">
                    <div className="skeleton-line skeleton-line-long" />
                    <div className="skeleton-line skeleton-line-short" />
                  </div>
                </div>
                <div className="skeleton-line skeleton-line-medium" />
                <div className="skeleton-line skeleton-line-long" />
                <div className="skeleton-button" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && doctors.length === 0 && (
          <div className="doctors-empty-state">
            <div className="empty-search-icon" aria-hidden="true">⌕</div>
            <h3>No doctors found</h3>
            <p>
              We couldn't find a match. Try another name or select a
              different specialty.
            </p>
            <button
              type="button"
              className="doctors-empty-button"
              onClick={clearFilters}
            >
              Show all doctors
            </button>
          </div>
        )}

        {!loading && !error && doctors.length > 0 && (
          <div className="doctors-grid">
            {doctors.map((doctor) => {
              const name = doctor.user?.name || 'Doctor';

              return (
                <article key={doctor._id} className="doctor-profile-card">
                  <div className="doctor-card-topline">
                    <span className="doctor-available-label">
                      <span />
                      Appointment booking
                    </span>
                    <span className="doctor-card-symbol" aria-hidden="true">
                      +
                    </span>
                  </div>

                  <div className="doctor-profile-header">
                    <div className="doctor-profile-avatar" aria-hidden="true">
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div className="doctor-profile-identity">
                      <span className="doctor-role-label">MEDICAL SPECIALIST</span>
                      <h3>Dr. {name}</h3>
                      <span className="doctor-specialty-badge">
                        {doctor.specialization}
                      </span>
                    </div>
                  </div>

                  {doctor.bio ? (
                    <p className="doctor-profile-bio">{doctor.bio}</p>
                  ) : (
                    <p className="doctor-profile-bio doctor-bio-placeholder">
                      View availability and choose an appointment time
                      that works for you.
                    </p>
                  )}

                  <div className="doctor-card-divider" />

                  <div className="doctor-detail-row">
                    <span className="doctor-detail-icon" aria-hidden="true">₹</span>
                    <span className="doctor-detail-label">Consultation fee</span>
                    <strong>
                      Rs. {Number(doctor.fee ?? 0).toLocaleString()}
                    </strong>
                  </div>

                  <div className="doctor-detail-row">
                    <span className="doctor-detail-icon" aria-hidden="true">◷</span>
                    <span className="doctor-detail-label">Working hours</span>
                    <strong className="doctor-hours">
                      {doctor.startTime} – {doctor.endTime}
                    </strong>
                  </div>

                  <div className="doctor-working-days">
                    <span>Available days</span>
                    <p>{formatDays(doctor.workingDays)}</p>
                  </div>

                  <Link
                    to={`/doctors/${doctor._id}`}
                    className="doctor-book-button"
                  >
                    Book appointment
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
