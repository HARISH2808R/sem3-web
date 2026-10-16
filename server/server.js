
import express from "express";
import cors from "cors";
import crypto from "node:crypto";

const app = express();

app.use(cors());
app.use(express.json());

const doctors = [
  { id: 101, name: "Dr. Ravi Kumar", specialty: "Cardiology", qualification: "MBBS, MD (Cardiology)", experience: 12, rating: 4.9, fee: 600, bio: "Heart health, preventive cardiology and cardiac care." },
  { id: 102, name: "Dr. Priya Sharma", specialty: "Neurology", qualification: "MBBS, DM (Neurology)", experience: 9, rating: 4.8, fee: 700, bio: "Diagnosis and treatment of neurological conditions." },
  { id: 103, name: "Dr. Arun Kumar", specialty: "Dermatology", qualification: "MBBS, MD (Dermatology)", experience: 8, rating: 4.7, fee: 500, bio: "Skin, hair and nail health and treatment." },
  { id: 104, name: "Dr. Meena Iyer", specialty: "Pediatrics", qualification: "MBBS, MD (Pediatrics)", experience: 10, rating: 4.9, fee: 450, bio: "Preventive and general healthcare for children." },
  { id: 105, name: "Dr. Karthik Raj", specialty: "Orthopedics", qualification: "MBBS, MS (Orthopedics)", experience: 11, rating: 4.8, fee: 550, bio: "Bone, joint, mobility and sports injury care." },
  { id: 106, name: "Dr. Nandhini Devi", specialty: "Gynecology", qualification: "MBBS, MS (Obstetrics & Gynecology)", experience: 7, rating: 4.7, fee: 600, bio: "Women's health and routine gynecological care." },
  { id: 107, name: "Dr. Suresh Menon", specialty: "Ophthalmology", qualification: "MBBS, MS (Ophthalmology)", experience: 14, rating: 4.8, fee: 500, bio: "Eye examinations and vision care." },
  { id: 108, name: "Dr. Aisha Rahman", specialty: "Psychiatry", qualification: "MBBS, MD (Psychiatry)", experience: 6, rating: 4.6, fee: 650, bio: "Mental wellness consultations and support." },
  { id: 109, name: "Dr. Vignesh Anand", specialty: "ENT", qualification: "MBBS, MS (ENT)", experience: 9, rating: 4.7, fee: 450, bio: "Ear, nose and throat diagnosis and care." },
  { id: 110, name: "Dr. Lakshmi Narayanan", specialty: "General Medicine", qualification: "MBBS, MD (General Medicine)", experience: 15, rating: 4.9, fee: 400, bio: "Primary care, routine checkups and common illnesses." }
];

let appointments = [];

const tokens = new Map();
const TOKEN_TTL_MS = 30 * 60 * 1000;

const users = new Map();

function hashPassword(
  password,
  salt = crypto.randomBytes(16).toString("hex")
) {
  return {
    salt,
    hash: crypto.scryptSync(password, salt, 64).toString("hex")
  };
}

function passwordMatches(password, user) {
  const actual = crypto.scryptSync(password, user.salt, 64);
  const expected = Buffer.from(user.hash, "hex");

  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected)
  );
}

// Authentication middleware
function auth(req, res, next) {
  const match = (req.headers.authorization || "").match(
    /^Bearer\s+(.+)$/i
  );

  const token = match?.[1];
  const session = token ? tokens.get(token) : null;

  if (!session || session.expiresAt <= Date.now()) {
    if (token) tokens.delete(token);

    return res.status(401).json({
      message: "Unauthorized or expired token. Please log in again."
    });
  }

  req.user = session.user;
  req.authToken = token;

  next();
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Register
app.post("/api/register", (req, res) => {
  const name =
    typeof req.body?.name === "string"
      ? req.body.name.trim()
      : "";

  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  const address =
    typeof req.body?.address === "string"
      ? req.body.address.trim()
      : "";

  const mobile =
    typeof req.body?.mobile === "string"
      ? req.body.mobile.replace(/\D/g, "")
      : "";

  const password =
    typeof req.body?.password === "string"
      ? req.body.password
      : "";

  if (
    name.length < 2 ||
    name.length > 80 ||
    /[<>]/.test(name)
  ) {
    return res.status(400).json({
      message: "Enter a valid name (2–80 characters)."
    });
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    return res.status(400).json({
      message: "Enter a valid email address."
    });
  }

  if (
    address.length < 5 ||
    address.length > 200 ||
    /[<>]/.test(address)
  ) {
    return res.status(400).json({
      message: "Enter your complete address (5–200 characters)."
    });
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({
      message: "Enter a valid 10-digit Indian mobile number."
    });
  }

  if (
    password.length < 8 ||
    password.length > 128 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return res.status(400).json({
      message: "Password must be 8–128 characters and include a letter and a number."
    });
  }

  if (users.has(email) || email === "patient@example.com") {
    return res.status(409).json({
      message: "An account with this email already exists. Please sign in."
    });
  }

  users.set(email, {
    id: `P${String(1002 + users.size).padStart(4, "0")}`,
    name,
    email,
    address,
    mobile,
    ...hashPassword(password)
  });

  res.status(201).json({
    message: "Account created successfully. Please sign in."
  });
});

// Login and token generation
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};

  const identity = String(email || "").trim().toLowerCase();
  const registeredUser = users.get(identity);

  const isDemoUser =
    (identity === "patient@example.com" || identity === "p1001") &&
    password === "123456";

  if (
    !isDemoUser &&
    !(
      registeredUser &&
      passwordMatches(String(password || ""), registeredUser)
    )
  ) {
    return res.status(401).json({
      message: "Invalid email/patient ID or password."
    });
  }

  // Generate a random 64-character hexadecimal token
  const token = crypto.randomBytes(32).toString("hex");

  const patient = isDemoUser
    ? {
        id: "P1001",
        name: "Demo Patient",
        email: "patient@example.com"
      }
    : {
        id: registeredUser.id,
        name: registeredUser.name,
        email: registeredUser.email,
        address: registeredUser.address,
        mobile: registeredUser.mobile
      };

  // Store token in backend memory for 30 minutes
  tokens.set(token, {
    user: patient,
    expiresAt: Date.now() + TOKEN_TTL_MS
  });

  // Send token to the frontend
  res.json({
    token,
    expiresIn: TOKEN_TTL_MS / 1000,
    patient
  });
});

// Logout
app.post("/api/logout", auth, (req, res) => {
  tokens.delete(req.authToken);

  res.json({
    message: "Logged out successfully."
  });
});

// Get and search doctors
app.get("/api/doctors", (req, res) => {
  const search = String(req.query.search || "").toLowerCase();
  const specialty = String(req.query.specialty || "").toLowerCase();

  const result = doctors.filter(
    d =>
      (
        d.name.toLowerCase().includes(search) ||
        d.specialty.toLowerCase().includes(search)
      ) &&
      (!specialty || d.specialty.toLowerCase() === specialty)
  );

  res.json(result);
});

// Get a doctor by ID
app.get("/api/doctors/:id", (req, res) => {
  const doctor = doctors.find(
    d => d.id === Number(req.params.id)
  );

  if (!doctor) {
    return res.status(404).json({
      message: "Doctor not found."
    });
  }

  res.json(doctor);
});

// Get doctor availability
app.get("/api/doctors/:id/availability", (req, res) => {
  const doctor = doctors.find(
    d => d.id === Number(req.params.id)
  );

  if (!doctor) {
    return res.status(404).json({
      message: "Doctor not found."
    });
  }

  res.json({
    doctorId: doctor.id,
    dates: [
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-19",
      "2026-10-20"
    ],
    slots: [
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "02:00 PM",
      "03:00 PM",
      "04:00 PM"
    ]
  });
});

// Get all appointments for the logged-in patient
app.get("/api/appointments", auth, (req, res) => {
  res.json(
    appointments.filter(a => a.patientId === req.user.id)
  );
});

// Get one appointment
app.get("/api/appointments/:id", auth, (req, res) => {
  const item = appointments.find(
    a =>
      a.id === Number(req.params.id) &&
      a.patientId === req.user.id
  );

  if (!item) {
    return res.status(404).json({
      message: "Appointment not found."
    });
  }

  res.json(item);
});

// Book an appointment
app.post("/api/appointments", auth, (req, res) => {
  const {
    doctorId,
    date,
    time,
    patientName,
    email,
    phone
  } = req.body || {};

  const cleanName =
    typeof patientName === "string"
      ? patientName.trim().replace(/[<>]/g, "")
      : "";

  const cleanEmail =
    typeof email === "string"
      ? email.trim().toLowerCase()
      : "";

  const cleanPhone =
    typeof phone === "string"
      ? phone.trim()
      : "";

  if (
    !doctorId ||
    !date ||
    !time ||
    !cleanName ||
    !cleanEmail ||
    !cleanPhone
  ) {
    return res.status(400).json({
      message: "All appointment fields are required."
    });
  }

  if (
    cleanName.length > 80 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    !/^[6-9]\d{9}$/.test(cleanPhone)
  ) {
    return res.status(400).json({
      message: "Please provide valid patient details."
    });
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2} (AM|PM)$/.test(time)
  ) {
    return res.status(400).json({
      message: "Please provide a valid appointment date and time."
    });
  }

  const doctor = doctors.find(
    d => d.id === Number(doctorId)
  );

  if (!doctor) {
    return res.status(400).json({
      message: "Select a valid doctor."
    });
  }

  const appointment = {
    id: Date.now(),
    patientId: req.user.id,
    doctorId: doctor.id,
    doctorName: doctor.name,
    specialty: doctor.specialty,
    date,
    time,
    patientName: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    status: "Booked",
    createdAt: new Date().toISOString()
  };

  appointments.unshift(appointment);

  res.status(201).json(appointment);
});

// Reschedule an appointment
app.patch("/api/appointments/:id", auth, (req, res) => {
  const item = appointments.find(
    a =>
      a.id === Number(req.params.id) &&
      a.patientId === req.user.id
  );

  if (!item) {
    return res.status(404).json({
      message: "Appointment not found."
    });
  }

  const { date, time } = req.body || {};

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      message: "Invalid appointment date."
    });
  }

  if (time && !/^\d{2}:\d{2} (AM|PM)$/.test(time)) {
    return res.status(400).json({
      message: "Invalid appointment time."
    });
  }

  if (date) item.date = date;
  if (time) item.time = time;

  item.status = "Rescheduled";

  res.json(item);
});

// Cancel an appointment
app.delete("/api/appointments/:id", auth, (req, res) => {
  const index = appointments.findIndex(
    a =>
      a.id === Number(req.params.id) &&
      a.patientId === req.user.id
  );

  if (index < 0) {
    return res.status(404).json({
      message: "Appointment not found."
    });
  }

  const [deleted] = appointments.splice(index, 1);

  res.json({
    message: "Appointment cancelled.",
    appointment: deleted
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Hospital API running at http://localhost:${PORT}`);
});
