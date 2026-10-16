import React, { Suspense, lazy } from "react";

// AppCore contains the application routes and page components, including Doctors.
// Lazy-load the application shell to enable code splitting without importing a missing pages/Doctors file.
const AppCore = lazy(() => import("./AppCore.jsx"));

export default function App() {
  return (
    <Suspense fallback={<main aria-live="polite" className="notice">Loading Medicare application…</main>}>
      <AppCore />
    </Suspense>
  );
}
