import React, { createContext, useContext, useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api } from "./api";
import { cancelAppointment, createAppointment, fetchAppointments, fetchDoctors, rescheduleAppointment } from "./store";
import { store } from "./store";

export const AuthContext = createContext(null);
function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);
  const location = useLocation();
  return token ? children : <Navigate to="/login" replace state={{ from: location }} />;
}
function Button({ children, ...props }) { return <button {...props}>{children}</button>; }
function Input(props) { return <input {...props} />; }
function Loading() { return <p className="notice">Loading…</p>; }
function ErrorBoundary({ children }) {
  return <BoundaryInner>{children}</BoundaryInner>;
}
class BoundaryInner extends React.Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? <div className="notice error">Something went wrong. Please refresh the page.</div> : this.props.children; }
}
export function DoctorCard({ doctor }) {
  return <article className="doctor card">
    <div className="avatar">{doctor.name.split(" ").filter(Boolean).slice(-1)[0]?.[0] || "D"}</div>
    <div className="grow"><h3>{doctor.name}</h3><p>{doctor.specialty} · {doctor.qualification}</p><p>{doctor.experience} years experience · ⭐ {doctor.rating}</p><strong>₹{doctor.fee}</strong></div>
    <Link className="button" to={`/doctor/${doctor.id}`}>View profile</Link>
  </article>;
}
export function TimeSlot({ time, selected, onClick }) {
  return <button type="button" className={selected ? "slot selected" : "slot"} onClick={onClick} aria-pressed={selected} aria-label={`${time}${selected ? ", selected" : ""}`}>{time}</button>;
}
export function AppointmentCard({ item, onCancel, onReschedule }) {
  return <article className="card appointment">
    <div className="grow"><h3>{item.doctorName}</h3><p>{item.date} at {item.time}</p><p>{item.patientName} · {item.phone}</p><span className="status">{item.status}</span></div>
    <div className="actions"><Button onClick={() => onReschedule(item)}>Reschedule</Button><Button className="danger" onClick={() => onCancel(item.id)}>Cancel</Button></div>
  </article>;
}
function Login() {
  const { login } = useContext(AuthContext);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  async function submit(e) {
    e.preventDefault(); setError("");
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity);
    const isPatientId = /^P\d{4}$/i.test(identity.trim());
    if (!isEmail && !isPatientId) return setError("Enter a valid email or patient ID (example: P1001).");
    if (password.length < 6) return setError("Password must contain at least 6 characters.");
    try { setBusy(true); await login(identity.trim(), password); navigate(location.state?.from?.pathname || "/", { replace: true }); }
    catch (err) { setError(err.response?.data?.message || "Login failed."); }
    finally { setBusy(false); }
  }
  return <section className="panel narrow auth-panel"><span className="eyebrow">WELCOME BACK</span><h1>Patient sign in</h1><p className="muted">Sign in to manage your appointments. Demo: patient@example.com / 123456</p>
    <form onSubmit={submit} className="form">
      <label>Patient ID or Email<Input type="text" autoComplete="username" aria-label="Patient ID or Email" value={identity} onChange={e => setIdentity(e.target.value)} placeholder="patient@example.com or P1001" required /></label>
      <label>Password<Input type="password" autoComplete="current-password" aria-label="Password" value={password} onChange={e => setPassword(e.target.value)} minLength="6" required /></label>
      {error && <p className="error" role="alert">{error}</p>}<Button disabled={busy}>{busy ? "Signing in…" : "Login"}</Button>
    </form><p className="auth-switch">New to Medicare? <Link to="/signup">Create an account</Link></p></section>;
}
function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  async function submit(e) {
    e.preventDefault(); setError("");
    const cleanName = name.trim(); const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 80 || /[<>]/.test(cleanName)) return setError("Enter a valid name (2–80 characters).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return setError("Enter a valid email address.");
    const cleanAddress = address.trim(); const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanAddress.length < 5 || cleanAddress.length > 200 || /[<>]/.test(cleanAddress)) return setError("Enter your complete address (5–200 characters).");
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) return setError("Enter a valid 10-digit Indian mobile number.");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return setError("Use at least 8 characters with at least one letter and one number.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    try {
      setBusy(true);
      await api.post("/register", { name: cleanName, email: cleanEmail, address: cleanAddress, mobile: cleanMobile, password });
      await login(cleanEmail, password);
      navigate("/patient", { replace: true });
    } catch (err) { setError(err.response?.data?.message || "Could not create account. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="panel narrow auth-panel"><span className="eyebrow">JOIN MEDICARE</span><h1>Create your account</h1><p className="muted">Register to book and manage hospital appointments.</p>
    <form onSubmit={submit} className="form" noValidate>
      <label htmlFor="signup-name">Full name</label><Input id="signup-name" name="name" type="text" autoComplete="name" minLength="2" maxLength="80" value={name} onChange={e => setName(e.target.value)} required />
      <label htmlFor="signup-email">Email address</label><Input id="signup-email" name="email" type="email" autoComplete="email" maxLength="254" value={email} onChange={e => setEmail(e.target.value)} required />
      <label htmlFor="signup-address">Address</label><Input id="signup-address" name="address" type="text" autoComplete="street-address" minLength="5" maxLength="200" value={address} onChange={e => setAddress(e.target.value.replace(/[<>]/g, ""))} required />
      <label htmlFor="signup-mobile">Mobile number</label><Input id="signup-mobile" name="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" pattern="[6-9][0-9]{9}" maxLength="10" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} required />
      <label htmlFor="signup-password">Password</label><Input id="signup-password" name="password" type="password" autoComplete="new-password" minLength="8" maxLength="128" aria-describedby="password-help" value={password} onChange={e => setPassword(e.target.value)} required />
      <small id="password-help" className="muted">At least 8 characters, including a letter and a number.</small>
      <label htmlFor="signup-confirm">Confirm password</label><Input id="signup-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength="8" maxLength="128" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
      {error && <p className="error" role="alert">{error}</p>}
      <Button disabled={busy}>{busy ? "Creating account…" : "Sign up"}</Button>
    </form><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
  </section>;
}

function Home() {
  const { token } = useContext(AuthContext);
  return <section className="hero"><div><span className="eyebrow">YOUR HEALTH, OUR PRIORITY</span><h1>Care that fits<br />your schedule.</h1><p>Find trusted doctors and book your hospital appointment in minutes.</p><div className="actions"><Link className="button" to="/doctors">Find a doctor</Link>{token ? <Link className="button secondary" to="/appointments">My appointments</Link> : <><Link className="button secondary" to="/login">Patient sign in</Link><Link className="button" to="/signup">Create account</Link></>}</div></div><div className="hero-art"><div className="cross">✚</div><div className="circle-text">MEDICARE<br/><small>CARE • TRUST • HEALTH</small></div></div></section>;
}
export function Doctors() {
  const dispatch = useDispatch(); const { doctors, loading, error } = useSelector(s => s);
  const [search, setSearch] = useState(""); const [specialty, setSpecialty] = useState("");
  useEffect(() => { dispatch(fetchDoctors({})); }, [dispatch]);
  async function find(e) { e.preventDefault(); dispatch(fetchDoctors({ search, specialty })); }
  return <section><div className="page-heading"><div><span className="eyebrow">OUR MEDICAL TEAM</span><h1>Find your doctor</h1><p className="muted">{doctors.length} specialists available</p></div></div>
    <form className="searchbar" onSubmit={find}><Input aria-label="Search doctor or specialty" placeholder="Search doctor or specialty" value={search} onChange={e => setSearch(e.target.value)} />
      <select aria-label="Filter by specialty" value={specialty} onChange={e => setSpecialty(e.target.value)}><option value="">All specialties</option>{["Cardiology", "Dermatology", "ENT", "General Medicine", "Gynecology", "Neurology", "Ophthalmology", "Orthopedics", "Pediatrics", "Psychiatry"].map(name => <option key={name} value={name}>{name}</option>)}</select><Button type="submit">Search</Button></form>
    {loading && <Loading />}{error && <p className="error" role="alert">{error}</p>}
    <div className="stack">{doctors.map(d => <DoctorCard key={d.id} doctor={d} />)}</div>
  </section>;
}
function DoctorProfile() {
  const { id } = useParams(); const [doctor, setDoctor] = useState(null); const [availability, setAvailability] = useState(null); const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [d, a] = await Promise.all([api.get(`/doctors/${id}`), api.get(`/doctors/${id}/availability`)]);
        if (active) { setDoctor(d.data); setAvailability(a.data); }
      } catch (e) { if (active) setError(e.response?.data?.message || "Could not load doctor."); }
    }
    load(); return () => { active = false; };
  }, [id]);
  if (error) return <p className="error" role="alert">{error}</p>; if (!doctor) return <Loading />;
  return <section className="panel"><span className="eyebrow">DOCTOR PROFILE</span><h1>{doctor.name}</h1><h3>{doctor.specialty}</h3><p>{doctor.qualification} · {doctor.experience} years experience</p><p>⭐ {doctor.rating} rating · Consultation fee ₹{doctor.fee}</p>
    <h3>Available days</h3><p>Monday to Saturday</p><h3>Available dates</h3><p>{availability?.dates.join(" · ")}</p><h3>Available time slots</h3><p>{availability?.slots.join(" · ")}</p>
    <Link className="button" to={`/book-appointment?doctorId=${doctor.id}`}>Book appointment</Link></section>;
}
export function BookAppointment() {
  const dispatch = useDispatch(); const doctors = useSelector(s => s.doctors); const { token } = useContext(AuthContext);
  const navigate = useNavigate(); const params = new URLSearchParams(window.location.search);
  const [doctorId, setDoctorId] = useState(params.get("doctorId") || "");
  const [date, setDate] = useState(""); const [time, setTime] = useState("");
  const [patientName, setPatientName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  const [slots, setSlots] = useState([]); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!doctors.length) dispatch(fetchDoctors({})); }, [doctors.length, dispatch]);
  useEffect(() => { if (doctorId) api.get(`/doctors/${doctorId}/availability`).then(r => setSlots(r.data.slots)).catch(() => setSlots([])); }, [doctorId]);
  async function submit(e) {
    e.preventDefault(); setError("");
    if (!doctorId) return setError("Please select a doctor.");
    if (!date || date < new Date().toISOString().slice(0, 10)) return setError("Choose a valid appointment date.");
    if (!time) return setError("Please select a time slot.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email.");
    if (!/^[6-9]\d{9}$/.test(phone)) return setError("Enter a valid 10-digit Indian phone number.");
    try {
      setBusy(true);
      const result = await dispatch(createAppointment({ doctorId: Number(doctorId), date, time, patientName, email, phone })).unwrap();
      navigate(`/appointment/${result.id}`);
    } catch (e) { setError(typeof e === "string" ? e : e.message || "Booking failed."); }
    finally { setBusy(false); }
  }
  if (!token) return <Navigate to="/login" replace />;
  return <section className="panel"><span className="eyebrow">NEW BOOKING</span><h1>Book an appointment</h1>
    <form className="form" onSubmit={submit}>
      <label>Doctor<select required value={doctorId} onChange={e => setDoctorId(e.target.value)}><option value="">Select doctor</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}</select></label>
      <label>Date<Input type="date" min={new Date().toISOString().slice(0, 10)} required value={date} onChange={e => setDate(e.target.value)} /></label>
      <div><label>Available time slots</label><div className="slots">{slots.map(slot => <TimeSlot key={slot} time={slot} selected={time === slot} onClick={() => setTime(slot)} />)}</div></div>
      <label>Patient name<Input autoComplete="name" maxLength="80" required value={patientName} onChange={e => setPatientName(e.target.value.replace(/[<>]/g, ""))} aria-label="Patient name" /></label>
      <label>Email<Input type="email" autoComplete="email" maxLength="254" required value={email} onChange={e => setEmail(e.target.value.trimStart())} aria-label="Email" /></label>
      <label>Phone number<Input type="tel" autoComplete="tel" inputMode="numeric" required value={phone} onChange={e => setPhone(e.target.value.replace(/\\D/g, "").slice(0, 10))} maxLength="10" aria-label="Phone number" /></label>
      {error && <p className="error" role="alert">{error}</p>}<Button disabled={busy}>{busy ? "Booking…" : "Confirm booking"}</Button>
    </form></section>;
}
function Confirmation() {
  const { id } = useParams(); const appointments = useSelector(s => s.appointments);
  const item = appointments.find(a => String(a.id) === id);
  return <section className="panel"><div className="success-mark">✓</div><h1>Appointment confirmed</h1><p>Your booking ID is #{id}.</p>{item && <p>{item.doctorName} · {item.date} · {item.time}</p>}<Link className="button" to="/appointments">View appointment history</Link></section>;
}
function Appointments() {
  const dispatch = useDispatch(); const { appointments, loading, error } = useSelector(s => s);
  const [message, setMessage] = useState("");
  useEffect(() => { dispatch(fetchAppointments()); }, [dispatch]);
  async function cancel(id) { if (confirm("Cancel this appointment?")) { try { await dispatch(cancelAppointment(id)).unwrap(); setMessage("Appointment cancelled."); } catch { setMessage("Unable to cancel appointment."); } } }
  async function reschedule(item) {
    const date = prompt("Enter new date (YYYY-MM-DD):", item.date); if (!date) return;
    const time = prompt("Enter new time slot:", item.time); if (!time) return;
    try { await dispatch(rescheduleAppointment({ id: item.id, date, time })).unwrap(); setMessage("Appointment rescheduled."); }
    catch { setMessage("Unable to reschedule appointment."); }
  }
  return <section><div className="page-heading"><div><span className="eyebrow">PATIENT PORTAL</span><h1>Appointment history</h1></div><Link className="button" to="/doctors">+ New booking</Link></div>
    {loading && <Loading />}{error && <p className="error" role="alert">{error}</p>}{message && <p className="notice">{message}</p>}
    {appointments.length ? <div className="stack">{appointments.map(a => <AppointmentCard key={a.id} item={a} onCancel={cancel} onReschedule={reschedule} />)}</div> : !loading && <div className="empty card"><h3>No appointments yet</h3><p>Your bookings will appear here.</p><Link to="/doctors">Find a doctor</Link></div>}
  </section>;
}
function PatientLayout() {
  const { patient } = useContext(AuthContext);
  return <section className="patient-layout">
    <div className="page-heading"><div><span className="eyebrow">PATIENT PORTAL</span><h1>Patient dashboard</h1><p className="muted">Welcome{patient?.name ? `, ${patient.name}` : ""}. Manage your care in one place.</p></div></div>
    <div className="patient-tabs">
      <NavLink end to="/patient">Overview</NavLink>
      <NavLink to="/patient/appointments">Appointments</NavLink>
      <NavLink to="/patient/upcoming">Upcoming</NavLink>
      <NavLink to="/patient/history">History</NavLink>
      <NavLink to="/patient/profile">Profile</NavLink>
    </div>
    <div className="patient-content"><Outlet /></div>
  </section>;
}
function PatientOverview() {
  const navigate = useNavigate();
  return <div className="panel"><h2>Welcome to your dashboard</h2><p>View upcoming visits, review past appointments, or update your profile.</p><div className="actions"><Button onClick={() => navigate("/patient/upcoming")}>Upcoming appointments</Button><Button className="secondary" onClick={() => navigate("/patient/profile")}>My profile</Button></div></div>;
}
function PatientAppointmentsView({ mode = "all" }) {
  const dispatch = useDispatch(); const { appointments, loading, error } = useSelector(s => s);
  useEffect(() => { dispatch(fetchAppointments()); }, [dispatch]);
  const today = new Date().toISOString().slice(0, 10);
  const list = appointments.filter(a => mode === "upcoming" ? a.date >= today && a.status !== "Cancelled" : mode === "history" ? a.date < today || a.status === "Cancelled" : true);
  return <div><div className="page-heading"><h2>{mode === "upcoming" ? "Upcoming appointments" : mode === "history" ? "Appointment history" : "All appointments"}</h2><Link className="button" to="/doctors">+ New booking</Link></div>
    {loading && <Loading />}{error && <p className="error" role="alert">{error}</p>}
    {list.length ? <div className="stack">{list.map(a => <AppointmentCard key={a.id} item={a} onCancel={id => dispatch(cancelAppointment(id))} onReschedule={item => { const date = prompt("New date (YYYY-MM-DD):", item.date); const time = date && prompt("New time:", item.time); if (date && time) dispatch(rescheduleAppointment({ id: item.id, date, time })); }} />)}</div> : <div className="empty card"><h3>No appointments found</h3><p>Your appointments will appear here.</p><Link to="/doctors">Find a doctor</Link></div>}</div>;
}
function PatientAllAppointments() { return <PatientAppointmentsView mode="all" />; }
function PatientUpcoming() { return <PatientAppointmentsView mode="upcoming" />; }
function PatientHistory() { return <PatientAppointmentsView mode="history" />; }
function PatientProfile() {
  const { patient } = useContext(AuthContext);
  return <div className="panel"><h2>Patient profile</h2><p><strong>Name:</strong> {patient?.name || "Demo Patient"}</p><p><strong>Email:</strong> {patient?.email || "patient@example.com"}</p><p><strong>Address:</strong> {patient?.address || "Not provided for demo account"}</p><p><strong>Mobile:</strong> {patient?.mobile || "Not provided for demo account"}</p><p>To update your information, contact the hospital reception.</p></div>;
}
function NotFound() { return <section className="panel"><h1>Page not found</h1><Link to="/">Return home</Link></section>; }

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("hospital_token") || "");
  const [patient, setPatient] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hospital_patient") || "null"); }
    catch { return null; }
  });
  async function login(email, password) {
    const res = await api.post("/login", { email, password });
    localStorage.setItem("hospital_token", res.data.token);
    localStorage.setItem("hospital_patient", JSON.stringify(res.data.patient));
    setToken(res.data.token);
    setPatient(res.data.patient);
  }
  async function logout() {
    try { if (token) await api.post("/logout"); } catch {}
    localStorage.removeItem("hospital_token");
    localStorage.removeItem("hospital_patient");
    setToken(""); setPatient(null);
    window.location.assign("/login");
  }
  useEffect(() => {
    const handler = () => {
      setToken("");
      setPatient(null);
      // Replace the current page so protected screens are not left visible.
      window.location.assign("/login");
    };
    window.addEventListener("hospital-unauthorized", handler);
    return () => window.removeEventListener("hospital-unauthorized", handler);
  }, []);
  return <AuthContext.Provider value={{ token, patient, login, logout }}>
    <div className="app-shell">
      <header className="topbar"><Link className="brand" to="/"><span className="brand-icon">✚</span><span>medicare<small>APPOINTMENT CARE</small></span></Link>
        <nav><NavLink to="/">Home</NavLink><NavLink to="/doctors">Doctors</NavLink>{token && <><NavLink to="/patient">Dashboard</NavLink><NavLink to="/appointments">Appointments</NavLink></>}</nav>
        {token ? <Button className="secondary" onClick={logout}>Logout</Button> : <div className="auth-nav"><Link className="text-link" to="/login">Sign in</Link><Link className="button" to="/signup">Sign up</Link></div>}
      </header>
      <main><ErrorBoundary><Routes>
        <Route path="/" element={<Home />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route path="/doctors" element={<Doctors />} /><Route path="/doctor/:id" element={<DoctorProfile />} />
        <Route path="/book-appointment" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
        <Route path="/appointment/:id" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
        <Route path="/patient" element={<ProtectedRoute><PatientLayout /></ProtectedRoute>}>
          <Route index element={<PatientOverview />} />
          <Route path="appointments" element={<PatientAllAppointments />} />
          <Route path="upcoming" element={<PatientUpcoming />} />
          <Route path="history" element={<PatientHistory />} />
          <Route path="profile" element={<PatientProfile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes></ErrorBoundary></main>
      <footer>© 2026 Medicare Hospital · Built for Scenario 8 experiments</footer>
    </div>
  </AuthContext.Provider>;
}
