import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import useAuthStore  from './store/auth.store';
import useAppStore   from './store/app.store';
import Layout        from './components/layout';
import AuthModal     from './components/auth/AuthModal';
import AIChatWidget  from './components/ai/ChatWidget';
import { ToastContainer } from './components/ui';

// Pages
import HomePage                          from './pages/Home';
import CoursesPage                       from './pages/Courses';
import { CourseDetailPage, AboutPage,
         CertificateVerifyPage }         from './pages/CourseDetail';
import DashboardPage                     from './pages/Dashboard';

// Lazy pages
const LearnPage     = React.lazy(() => import('./pages/Learn'));
const ProfilePage   = React.lazy(() => import('./pages/Profile'));
const AdminPage     = React.lazy(() => import('./pages/Admin'));
const InstructorPage = React.lazy(() => import('./pages/Instructor'));

// ── SEO meta helper ───────────────────────────────────────────
function useSEO(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | Stadi — Learn Skills. Start Earning.` : 'Stadi — Learn Skills. Start Earning. | Vocational Training Kenya';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && description) metaDesc.setAttribute('content', description);

    // OG tags
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title || 'Stadi');
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description || 'Learn practical vocational skills in 15 Kenyan languages. M-Pesa payments. Offline access. Earn from KES 150.');
  }, [title, description]);
}

function NotFound() {
  useSEO('Page Not Found');
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-3xl font-bold text-stadi-dark mb-2">Page not found</h1>
      <p className="text-stadi-gray mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary inline-flex">Go Home</a>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isLoggedIn, openAuth } = useAuthStore();
  useEffect(() => { if (!isLoggedIn) openAuth(); }, [isLoggedIn]);
  if (!isLoggedIn) return null;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuthStore();
  if (!['admin','super_admin'].includes(user?.role)) return <NotFound />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const { fetchMe, token }    = useAuthStore();
  const { toasts, removeToast } = useAppStore();

  // Restore session on mount
  useEffect(() => {
    if (token) fetchMe();
  }, []);

  return (
    <>
      <ScrollToTop />
      {/* Structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: 'Stadi Learning Platform',
        description: 'Vocational skills training for Kenya — 15 languages, offline access, M-Pesa payments',
        url: 'https://stadi.co.ke',
        address: { '@type': 'PostalAddress', addressLocality: 'Kisumu', addressCountry: 'KE' },
        contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', telephone: '+254700000000' },
      })}} />

      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-stadi-green border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Layout>
          <Routes>
            <Route path="/"                      element={<HomePage />} />
            <Route path="/courses"               element={<CoursesPage />} />
            <Route path="/courses/:slug"         element={<CourseDetailPage />} />
            <Route path="/about"                 element={<AboutPage />} />
            <Route path="/certificates/verify"   element={<CertificateVerifyPage />} />
            <Route path="/certificates/verify/:num" element={<CertificateVerifyPage />} />
            <Route path="/dashboard"             element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/*"           element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/learn/:courseId"       element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
            <Route path="/profile"               element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin/*"               element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="/instructor/*"          element={<ProtectedRoute><InstructorPage /></ProtectedRoute>} />
            <Route path="*"                      element={<NotFound />} />
          </Routes>
        </Layout>
      </React.Suspense>

      <AuthModal />
      <AIChatWidget />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}
