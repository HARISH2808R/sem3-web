SCENARIO 8 - EXPERIMENT 1: COMPONENT TESTING

Testing stack: Jest + React Testing Library + user-event + jsdom.

Tests cover:
1. Doctor card content and profile link.
2. Doctor search and specialty filter dispatch.
3. Loading and error states.
4. Time-slot selection and selected styling.
5. Appointment card cancellation callback.
6. Appointment card reschedule callback.
7. Booking form slot validation.
8. Successful booking submission and navigation.

RUN ON WINDOWS:
1. Open terminal in the client folder:
   cd "hari 4/client"
2. Install dependencies:
   npm install
3. Run all tests:
   npm test
4. Run tests in watch mode:
   npm run test:watch
5. Start the app as usual:
   npm run dev

The app components remain in src/App.jsx. The test file is src/App.test.jsx.
Jest is configured in jest.config.cjs and Babel in babel.config.cjs.
