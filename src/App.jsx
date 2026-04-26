import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import useAuthStore  from './store/auth.store';
import useAppStore   from './store/app.store';
import Layout        from './components/layout';
import AuthModal     from './components/auth/AuthModal';
import AIChatWidget  from './components/ai/ChatWidget';
import InstallBanner from './components/InstallBanner';
import { ToastContainer } from './components/ui';

import HomePage          from './pages/Home';
import CoursesPage       from './pages/Courses';
import { CourseDetailPage, AboutPage } from './pages/CourseDetail';
import DashboardPage     from './pages/Dashboard';
import CareersPage       from './pages/Careers';
import { MyCertificatesPage, CertificateVerifyPage } from './pages/Certificates';
import LegalPage         from './pages/Legal';
import PrivacyPage       from './pages/Privacy';
import TermsPage         from './pages/Terms';
import RefundPage        from './pages/Refund';
import SupportPage       from './pages/Support';

const LearnPage                = React.lazy(() => import('./pages/Learn'));
const ProfilePage              = React.lazy(() => import('./pages/Profile'));
const AdminPage                = React.lazy(() => import('./pages/Admin'));
const InstructorPage           = React.lazy(() => import('./pages/Instructor'));
const InstructorOnboardingPage = React.lazy(() => import('./pages/Instructoronboarding'));
const FinancePage              = React.lazy(() => import('./pages/Finance'));
const HRPage                   = React.lazy(() => import('./pages/HR'));

// ── useStoreHydration ─────────────────────────────────────────
// Zustand persist rehydrates from localStorage asynchronously.
// Until hydration completes, isLoggedIn is ALWAYS false — even
// for logged-in users. Every auth check must wait for this hook
// to return true before making routing decisions, otherwise the
// user gets kicked to login on every page load / navigation.
function useStoreHydration() {
  const [hydrated, setHydrated] = useState(
    useAuthStore.persist?.hasHydrated?.() ?? false
  );
  useEffect(() => {
    // Subscribe to hydration completion
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => setHydrated(true));
    // Check immediately in case it already finished before we subscribed
    if (useAuthStore.persist?.hasHydrated?.()) setHydrated(true);
    return () => unsub?.();
  }, []);
  return hydrated;
}

// ── Spinner ───────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-stadi-green border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// ── ProtectedRoute ────────────────────────────────────────────
// CRITICAL FIX: waits for Zustand persist hydration before
// making any auth decision. Without this wait, isLoggedIn is
// always false on the first render cycle — causing the login
// modal to flash open and the route to return null for every
// logged-in user on every page load and post-login redirect.
function ProtectedRoute({ children }) {
  const hydrated               = useStoreHydration();
  const { isLoggedIn, openAuth } = useAuthStore();

  useEffect(() => {
    // Only open the auth modal after hydration confirms user is not logged in
    if (hydrated && !isLoggedIn) openAuth();
  }, [hydrated, isLoggedIn]);

  // Still loading from localStorage — show spinner, not auth modal
  if (!hydrated) return <Spinner />;

  // Hydrated and confirmed not logged in — return null (modal opened above)
  if (!isLoggedIn) return null;

  return children;
}

// ── Role guards ───────────────────────────────────────────────
function AdminRoute({ children }) {
  const { user } = useAuthStore();
  if (!['admin', 'super_admin'].includes(user?.role)) {
    return <div className="text-center py-24"><p className="text-stadi-gray">Access denied.</p></div>;
  }
  return children;
}

function FinanceRoute({ children }) {
  const { user } = useAuthStore();
  if (!['finance', 'admin', 'super_admin'].includes(user?.role)) {
    return <div className="text-center py-24"><p className="text-stadi-gray">Finance access required.</p></div>;
  }
  return children;
}

function HRRoute({ children }) {
  const { user } = useAuthStore();
  if (!['hr', 'admin', 'super_admin'].includes(user?.role)) {
    return <div className="text-center py-24"><p className="text-stadi-gray">HR access required.</p></div>;
  }
  return children;
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-stadi-gray mb-4">
        404
      </div>
      <h1 className="text-3xl font-bold text-stadi-dark mb-2">Page not found</h1>
      <p className="text-stadi-gray mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary inline-flex">Go Home</a>
    </div>
  );
}

export default function App() {
  const { fetchMe, token }      = useAuthStore();
  const { toasts, removeToast } = useAppStore();

  // Refresh user profile on app mount — picks up role changes made
  // by admin without requiring the user to log out and back in.
  // Only runs when a token exists (skips for guests).
  useEffect(() => { if (token) fetchMe(); }, []);

  return (
    <>
      <ScrollToTop />
      <React.Suspense fallback={<Spinner />}>
        <Layout>
          <Routes>
            {/* ── Public ──────────────────────────────────────── */}
            <Route path="/"                            element={<HomePage />} />
            <Route path="/courses"                     element={<CoursesPage />} />
            <Route path="/courses/:slug"               element={<CourseDetailPage />} />
            <Route path="/about"                       element={<AboutPage />} />
            <Route path="/careers"                     element={<CareersPage />} />
            <Route path="/legal"                       element={<LegalPage />} />
            <Route path="/privacy"                     element={<PrivacyPage />} />
            <Route path="/privacy-policy"              element={<PrivacyPage />} />
            <Route path="/terms"                       element={<TermsPage />} />
            <Route path="/terms-of-service"            element={<TermsPage />} />
            <Route path="/refund"                      element={<RefundPage />} />
            <Route path="/refund-policy"               element={<RefundPage />} />
            <Route path="/support"                     element={<SupportPage />} />
            <Route path="/certificates/verify"         element={<CertificateVerifyPage />} />
            <Route path="/certificates/verify/:number" element={<CertificateVerifyPage />} />

            {/* ── Authenticated ───────────────────────────────── */}
            <Route path="/dashboard"              element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/certificates" element={<ProtectedRoute><MyCertificatesPage /></ProtectedRoute>} />
            <Route path="/learn/:courseId"        element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
            <Route path="/profile"               element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* ── Role-restricted ─────────────────────────────── */}
            <Route path="/admin/*"      element={<ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute>} />
            <Route path="/instructor/*" element={<ProtectedRoute><InstructorPage /></ProtectedRoute>} />
            <Route path="/teach"        element={<ProtectedRoute><InstructorOnboardingPage /></ProtectedRoute>} />
            <Route path="/finance/*"    element={<ProtectedRoute><FinanceRoute><FinancePage /></FinanceRoute></ProtectedRoute>} />
            <Route path="/hr/*"         element={<ProtectedRoute><HRRoute><HRPage /></HRRoute></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </React.Suspense>

      <AuthModal />
      <AIChatWidget />
      <InstallBanner />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}
