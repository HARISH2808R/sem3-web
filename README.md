# Scenario 8: Hospital Appointment Booking Web Application
## Complete implementation — Experiments 1, 2, 3 and 4

This project includes a React frontend, Redux Toolkit global store, Axios REST API client, and an Express backend with a list of 10 doctors.

## Doctors included
1. Dr. Ravi Kumar — Cardiology — ₹600
2. Dr. Priya Sharma — Neurology — ₹700
3. Dr. Arun Kumar — Dermatology — ₹500
4. Dr. Meena Iyer — Pediatrics — ₹450
5. Dr. Karthik Raj — Orthopedics — ₹550
6. Dr. Nandhini Devi — Gynecology — ₹600
7. Dr. Suresh Menon — Ophthalmology — ₹500
8. Dr. Aisha Rahman — Psychiatry — ₹650
9. Dr. Vignesh Anand — ENT — ₹450
10. Dr. Lakshmi Narayanan — General Medicine — ₹400

## Requirements
- Node.js 18 or later
- npm
- VS Code (recommended)

## Start the application
1. Extract the ZIP.
2. Open the `hospital-appointment-booking` folder in VS Code.
3. Open Terminal and run:

```bash
npm run install:all
npm run dev
```

4. Open `http://localhost:5173` in your browser. The API runs at `http://localhost:5000`.

If the combined command has a problem, open two terminals:
- Terminal 1: `cd server`, then `npm install`, then `npm start`
- Terminal 2: `cd client`, then `npm install`, then `npm run dev`

## Demo login
- Patient email: `patient@example.com`
- Patient ID: `P1001`
- Password: `123456`

Appointments are stored in memory by the demo backend, so they reset when the backend restarts.

---

# Experiment 1: Develop Hospital Appointment Application with REST APIs
**Topics:** REST API, Axios, Fetch, Async Data

a. Fetch doctor information using REST APIs: `GET /api/doctors` retrieves the doctors list from Express.  
b. Doctor search and specialty filtering: use the search field and dynamically populated specialty dropdown on the Find a Doctor page.  
c. Retrieve available dates and time slots: `GET /api/doctors/:id/availability`.  
d. Fetch individual doctor details dynamically: `GET /api/doctors/:id` on the doctor profile page.  
e. Asynchronous data: API calls use Axios promises and async/await.  
f. Loading/error states: doctor list, doctor profile, booking, login and appointment history display loading or error feedback.

# Experiment 2: Implement Appointment State Management
**Topics:** Redux Toolkit, Zustand, Middleware, Caching

a. Global appointment store: Redux Toolkit store in `client/src/store.js`.  
b. State covers doctors, appointment list, loading/error states, and appointment status; booking forms collect doctor, date, time and patient details.  
c. Booking, rescheduling and cancellation use `createAppointment`, `rescheduleAppointment`, and `cancelAppointment` async actions.  
d. `loggerMiddleware` prints appointment action types to the browser console.  
e. Doctor list results are cached in browser localStorage by search/specialty query.  
f. Redux async thunks set loading and error state for API operations.

# Experiment 3: Implement Appointment CRUD Operations using REST APIs
**Topics:** CRUD, Axios/Fetch, Async Operations

a. GET doctors and appointments: `GET /api/doctors`, `GET /api/appointments`.  
b. Create appointment: `POST /api/appointments`.  
c. Reschedule appointment: `PATCH /api/appointments/:id`.  
d. Cancel appointment: `DELETE /api/appointments/:id`.  
e. Appointment history is shown on the Appointment History page.  
f. API failures are caught and shown to the user; loading indicators are displayed while requests run.

# Experiment 4: Implement Hospital Authentication and Token Management
**Topics:** Authentication, Token Management, Protected APIs

a. Patient authentication: `POST /api/login`.  
b. Store/manage authentication token in localStorage for this classroom demonstration.  
c. Axios request interceptor attaches `Authorization: Bearer <token>` to API requests.  
d. Backend `auth` middleware protects appointment history, booking, rescheduling and cancellation routes. React protected routes redirect unauthenticated users to login.  
e. Logout calls `POST /api/logout` and clears the stored token.  
f. Backend returns HTTP 401 for missing/invalid tokens; Axios response interceptor clears token and dispatches the unauthorized event.

## Expected practical output
- Home page: CarePoint landing page with Find a Doctor and Patient Login.
- Find a Doctor: displays all 10 doctors with specialty, qualification, experience, rating and consultation fee; supports search and specialty filter.
- Doctor Profile: dynamically displays doctor details, availability dates and time slots.
- Login: accepts the demo email or patient ID and password above.
- Book Appointment: selects doctor/date/time and enters patient name, email and Indian phone number.
- Appointment Confirmation: shows booking ID and booking details.
- Appointment History: lists bookings and provides reschedule/cancel actions.
- Logout: ends the demo session and protected API requests require login again.

## Important note
This is a college practical/demo project. The Express server uses in-memory storage and demo credentials. For production use, add a database, password hashing, HTTPS, secure expiring sessions/tokens, rate limiting, and server-side authorization for patient-owned records.


# Experiment 2: Optimize Hospital Appointment Application
**Topics:** Performance, Lazy Loading, Code Splitting, PWA, Accessibility, Security

a. **Lazy loading and code splitting:** the React application is loaded through `React.lazy()` and `Suspense`, so the main application bundle is deferred and a loading fallback is shown while it loads. Vite produces optimized production assets during `npm run build`.

b. **Doctor details and appointment views:** doctor profile and appointment data are requested only when those pages are opened. Doctor details and availability are fetched concurrently with `Promise.all`; doctor list searches are submitted on demand rather than on every keystroke.

c. **Doctor display and API optimization:** doctor cards use lightweight initials rather than downloading large profile images. Doctor-list responses are cached by search/filter query; the API response cache is used only for the non-sensitive doctor catalogue. JSON request size is limited on the server.

d. **PWA basics:** the app includes a web manifest, theme metadata, an SVG app icon, and a service worker. The worker caches the app shell/static assets for repeat visits and offline fallback; it deliberately does not cache `/api/` responses or authenticated patient information. The service worker is registered for production builds.

e. **Accessibility:** appointment time buttons expose `aria-pressed` and accessible labels; form fields have labels, autocomplete/input modes, and errors use `role="alert"`. Keyboard users can tab to and activate standard links, buttons, and form controls. Focus styles are included in CSS.

f. **Input and authentication security:** client-side fields trim/filter basic input and validate email/phone/date/slot; the server independently validates appointment data and limits JSON payload size. Authentication tokens are kept in `localStorage` rather than persistent `localStorage` and are cleared on HTTP 401. The API adds basic security headers and restricts CORS to `CLIENT_ORIGIN` (default `http://localhost:5173`).

**Production security note:** this remains a classroom demo: the backend uses in-memory demo credentials/tokens and appointments. Before real deployment, use HTTPS, password hashing, expiring server-side sessions or secure HttpOnly cookies, login rate limiting, a persistent database, per-patient authorization, and a Content Security Policy. Session storage does not protect against XSS.


## Sign in and sign up
- Open `/signup` to create a patient account with name, email, and password.
- Passwords are hashed with Node.js `scrypt` in the demo server; the raw password is not stored.
- Newly registered accounts and appointments are stored in memory and will reset when the server restarts. Use a persistent database and stronger production authentication before deployment.
- Demo login remains available: `patient@example.com` / `123456`.
- Start the API from `server` with `npm install` then `npm run dev`; start the frontend from `client` with `npm install` then `npm run dev`.
