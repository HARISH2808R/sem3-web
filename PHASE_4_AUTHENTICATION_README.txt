PHASE 4 — HOSPITAL AUTHENTICATION AND TOKEN MANAGEMENT

Implemented:
1. Patient login through POST /api/login (email or demo patient ID plus password).
2. Random bearer tokens stored in localStorage by the frontend.
3. Axios request interceptor attaches Authorization: Bearer <token>.
4. Appointment booking, appointment history/details, rescheduling, cancellation and logout require a valid token.
5. API token sessions expire after 30 minutes. Expired/invalid tokens return HTTP 401.
6. The frontend response interceptor removes the expired token and patient session, then the app redirects to /login.
7. The API associates each appointment with the authenticated patient ID and limits history, rescheduling, and cancellation to that patient's appointments.
8. Logout revokes the token on the server and clears the frontend session.

Run:
- Backend: open terminal in "unit 5 exp2/server", run npm install then npm run dev.
- Frontend: open another terminal in "unit 5 exp2/client", run npm install then npm run dev.
- Open the URL shown by Vite.

Demo login:
Email: patient@example.com
Password: 123456

Important demo limitations:
- Accounts, tokens, and appointments are stored in memory and reset when the backend restarts.
- This is an educational demo, not production authentication. For production, use a database, bcrypt/Argon2 password hashing, signed short-lived JWTs or secure opaque sessions, rate limiting, HTTPS, and secure cookie/token handling.
