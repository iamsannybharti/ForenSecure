import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import NotificationsBell from './NotificationsBell';
import MfaSettings from './MfaSettings';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/courses', label: 'Courses' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/seminars', label: 'Live Classes' },
  { to: '/blogs', label: 'Research' },
  // { to: '/services', label: 'Services (Coming Soon)' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout, token, refreshProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const closeDropdown = () => setIsDropdownOpen(false);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, [isDropdownOpen]);

  useEffect(() => setIsOpen(false), [pathname]);
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const isActive = (to: string) => {
    if (to === '/') return pathname === '/';
    if (to === '/blogs') return pathname === '/blogs' || pathname === '/blog' || pathname === '/article' || pathname === '/research';
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[78px] max-w-[1240px] items-center gap-7 px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Logo />
          {user?.role === 'admin' && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-700">Admin</span>}
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Main navigation">
          {NAV_LINKS.map(link => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs dark:bg-blue-950/40 dark:text-brand-glowCyan'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50/80 dark:text-slate-300 dark:hover:bg-slate-800/40'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {isAuthenticated ? (
            <>
              <NotificationsBell />
              {user?.role === 'admin' && (
                <Link to="/admin" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:border-slate-600">
                  Admin Portal
                </Link>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                  aria-label={`Open menu for ${user?.name || user?.email || 'your account'}`}
                >
                  {(user?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl ring-1 ring-black/5 z-[100] text-slate-800">
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1.5">
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{user?.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/dashboard');
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <UserIcon className="h-4 w-4 text-slate-450" /> Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <svg className="h-4 w-4 text-slate-450" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 transition-colors mt-1"
                    >
                      <LogOut className="h-4 w-4 text-red-500" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full border border-slate-200 px-[18px] py-[9px] text-sm font-semibold text-slate-950 hover:border-slate-600">Login</Link>
              <Link to="/login?mode=signup" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(4,154,146,.28)] hover:-translate-y-0.5 hover:bg-blue-700">Sign Up</Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(open => !open)}
          className="ml-auto grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-950 xl:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div id="mobile-nav" className={`absolute left-0 top-[78px] w-full overflow-hidden border-b border-slate-100 bg-white shadow-lg transition-all xl:hidden ${isOpen ? 'max-h-[calc(100svh-78px)] opacity-100' : 'max-h-0 border-transparent opacity-0'}`}>
        <nav className="mx-auto flex max-w-[1240px] flex-col gap-1 overflow-y-auto px-6 py-4" aria-label="Mobile navigation">
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive(link.to) ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}>
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="mt-2 grid gap-2 border-t border-slate-100 pt-3">
              <Link to="/dashboard" className="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white"><UserIcon className="h-4 w-4" /> Dashboard</Link>
              {user?.role === 'admin' && <Link to="/admin" className="rounded-full border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-950">Admin Portal</Link>}
              <button type="button" onClick={logout} className="py-2 text-sm font-semibold text-red-650">Sign out</button>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <Link to="/login" className="rounded-full border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-950">Login</Link>
              <Link to="/login?mode=signup" className="rounded-full bg-blue-600 py-2.5 text-center text-sm font-semibold text-white">Sign Up</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
