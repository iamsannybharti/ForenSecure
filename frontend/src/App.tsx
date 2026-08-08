import { useEffect, useLayoutEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import LearningPaths from './pages/LearningPaths';
import LearningPathDetails from './pages/LearningPathDetails';
import Quiz from './pages/Quiz';
import QuizAttempt from './pages/QuizAttempt';
import Certificates from './pages/Certificates';
import Diplomas from './pages/Diplomas';
import Faculty from './pages/Faculty';
import Research from './pages/Research';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Blogs from './pages/Blogs';
import BlogArticle from './pages/BlogArticle';
import Seminars from './pages/Seminars';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));

// Scroll to top helper on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // 'instant' so the new route doesn't smooth-scroll up through the old
    // page's content — html has scroll-behavior: smooth for anchors.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

/**
 * Reveals [data-reveal] / [data-reveal-stagger] elements as they scroll into
 * view. One shared observer for the whole app; each element is unobserved once
 * revealed so nothing keeps firing on later scrolls.
 *
 * The `reveal-ready` class on <html> is what makes the CSS hide them in the
 * first place, so if this component never runs the content stays visible.
 */
function ScrollReveal() {
  const { pathname } = useLocation();
  const enabled =
    typeof IntersectionObserver !== 'undefined' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Layout effect, not effect: this class is what hides the elements, so it
  // has to be applied before the first paint. In a passive effect the content
  // would paint visible, then hide, then fade back in — a visible flicker.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('reveal-ready', enabled);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      // threshold 0 deliberately: a percentage threshold can never be met by
      // an element taller than the viewport, which would leave a long section
      // hidden forever. The negative bottom margin is what delays the trigger
      // until the element is ~10% into view.
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    );

    // Wait a frame so the freshly routed page has committed to the DOM.
    const frame = requestAnimationFrame(() => {
      document
        .querySelectorAll('[data-reveal], [data-reveal-stagger]')
        .forEach(el => observer.observe(el));
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname, enabled]);

  return null;
}

/**
 * Replays the page-enter animation on every route change.
 *
 * Deliberately not `key={pathname}`: that would remount the entire route tree,
 * and where two paths render the same element (/certificates and
 * /certificates/:id) it would throw away that component's state. Restarting the
 * animation by hand keeps the tree mounted.
 */
function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('page-enter');
    void el.offsetWidth; // reflow — without it the class re-add is coalesced and nothing replays
    el.classList.add('page-enter');
  }, [pathname]);

  return <div ref={ref} className="page-enter">{children}</div>;
}

function AppContent() {
  return (
    <>
      <ScrollToTop />
      <ScrollReveal />
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-600">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Navbar />
        <main id="main-content" className="flex-grow">
          <Suspense fallback={
            <div className="flex min-h-[50vh] items-center justify-center bg-slate-50">
              <div className="w-8 h-8 border-2 border-brand-glowCyan border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <PageTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:slug" element={<CourseDetails />} />
              <Route path="/paths" element={<LearningPaths />} />
              <Route path="/paths/:slug" element={<LearningPathDetails />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/quiz/:id" element={<QuizAttempt />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/certificates/:id" element={<Certificates />} />
              <Route path="/diplomas" element={<Diplomas />} />
              <Route path="/faculty" element={<Faculty />} />
              <Route path="/research" element={<Research />} />
              <Route path="/services" element={<Services />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/myprofile" element={<Profile />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blog" element={<Navigate to="/blogs" replace />} />
              <Route path="/blogs/:slug" element={<BlogArticle />} />
              <Route path="/article" element={<Navigate to="/blogs" replace />} />
              <Route path="/seminars" element={<Seminars />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </PageTransition>
          </Suspense>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default function App() {
  return <Router><AppContent /></Router>;
}
