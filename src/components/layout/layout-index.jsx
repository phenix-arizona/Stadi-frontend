import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, Bell, Menu, X, Home, Search, Heart, Award,
  User, LogOut, Settings, ChevronDown, Moon, Sun,
  WifiOff, DollarSign, Building2, BarChart3, MessageCircle
} from 'lucide-react';
import useAuthStore from '../../store/auth.store';
import useAppStore  from '../../store/app.store';
import { Badge }    from '../ui';
import { LOGO_NAV, LOGO_ICON } from '../../assets/logo';

const LANGUAGES = [
  { code: 'english',  label: 'English'   },
  { code: 'swahili',  label: 'Kiswahili' },
  { code: 'dholuo',   label: 'Dholuo'    },
  { code: 'luhya',    label: 'Luhya'     },
  { code: 'kikuyu',   label: 'Kikuyu'    },
  { code: 'kalenjin', label: 'Kalenjin'  },
  { code: 'kamba',    label: 'Kamba'     },
  { code: 'kisii',    label: 'Kisii'     },
];

// ── Dark mode hook ────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('stadi-dark') === 'true' ||
      (!localStorage.getItem('stadi-dark') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stadi-dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stadi-dark', 'false');
    }
  }, [dark]);

  return [dark, setDark];
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  if (!offline) return null;
  return (
    <div className="bg-amber-500 text-white text-xs font-semibold text-center py-2 flex items-center justify-center gap-2">
      <WifiOff size={13} /> You're offline — showing saved content. Some features may be limited.
    </div>
  );
}

export function Navbar() {
  const { user, isLoggedIn, openAuth, logout, isAdmin, isFinance, isHR, isInstructor } = useAuthStore();
  const { language, setLanguage } = useAppStore();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen,    setLangOpen]    = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dark, setDark] = useDarkMode();
  const navigate = useNavigate();

  const userIsAdmin      = typeof isAdmin      === 'function' ? isAdmin()      : isAdmin;
  const userIsInstructor = typeof isInstructor === 'function' ? isInstructor() : isInstructor;
  const userIsFinance    = typeof isFinance     === 'function' ? isFinance()    : isFinance;
  const userIsHR         = typeof isHR          === 'function' ? isHR()         : isHR;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
      <OfflineBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img src={LOGO_NAV} alt="Stadi" className="h-9 w-auto" draggable={false} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/courses" className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-stadi-green' : 'text-stadi-gray dark:text-gray-300 hover:text-stadi-green'}`}>
              Browse Courses
            </NavLink>
            <NavLink to="/about" className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-stadi-green' : 'text-stadi-gray dark:text-gray-300 hover:text-stadi-green'}`}>
              About Stadi
            </NavLink>
            {/* ✅ Careers — next to About Stadi */}
            <NavLink to="/careers" className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-stadi-green' : 'text-stadi-gray dark:text-gray-300 hover:text-stadi-green'}`}>
              Careers
            </NavLink>
            {userIsAdmin && (
              <NavLink to="/admin" className={({ isActive }) =>
                `text-sm font-semibold transition-colors ${isActive ? 'text-stadi-orange' : 'text-stadi-orange hover:text-stadi-orange/80'}`}>
                Admin
              </NavLink>
            )}
            {!userIsAdmin && userIsInstructor && (
              <NavLink to="/instructor" className={({ isActive }) =>
                `text-sm font-semibold transition-colors ${isActive ? 'text-stadi-orange' : 'text-stadi-orange hover:text-stadi-orange/80'}`}>
                Instructor
              </NavLink>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">

            {/* ✅ WhatsApp CTA — prominent */}
            <a
              href="https://wa.me/254701901244?text=Hi%20Stadi!%20I%27d%20like%20to%20learn%20more%20about%20your%20courses."
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              title="Chat with us on WhatsApp"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>

            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-stadi-green"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-gray-400">
                  <X size={16} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 text-stadi-gray hover:text-stadi-green rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <Search size={18} />
              </button>
            )}

            {/* ✅ Dark mode toggle */}
            <button
              onClick={() => setDark(!dark)}
              className="p-2 text-stadi-gray hover:text-stadi-green rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Language selector */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 text-xs font-medium text-stadi-gray hover:text-stadi-green px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                🌍 {LANGUAGES.find(l => l.code === language)?.label || 'English'}
                <ChevronDown size={12} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50 w-36">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-stadi-green-light dark:hover:bg-gray-700 transition-colors
                        ${language === l.code ? 'text-stadi-green font-semibold' : 'text-stadi-gray dark:text-gray-300'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <>
                <Link to="/dashboard/notifications" className="p-2 text-stadi-gray hover:text-stadi-green rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 relative">
                  <Bell size={18} />
                </Link>
                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-stadi-green-light flex items-center justify-center text-stadi-green font-bold text-sm">
                      {user?.name?.[0]?.toUpperCase() || user?.phone?.slice(-2)}
                    </div>
                    <span className="text-sm font-medium text-stadi-dark dark:text-white hidden md:block max-w-[100px] truncate">
                      {user?.name || 'My Account'}
                    </span>
                    <ChevronDown size={13} className="text-gray-400 hidden md:block" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl py-2 z-50 w-52">
                      <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700">
                        <div className="font-semibold text-stadi-dark dark:text-white text-sm truncate">{user?.name || 'Learner'}</div>
                        <div className="text-xs text-stadi-gray">{user?.phone}</div>
                      </div>
                      {userIsAdmin && (
                        <Link to="/admin" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-stadi-orange hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                          <BarChart3 size={15} /> Admin Dashboard
                        </Link>
                      )}
                      {userIsFinance && !userIsAdmin && (
                        <Link to="/finance" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                          <DollarSign size={15} /> Finance Dashboard
                        </Link>
                      )}
                      {userIsHR && !userIsAdmin && (
                        <Link to="/hr" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors">
                          <Building2 size={15} /> HR Dashboard
                        </Link>
                      )}
                      {userIsInstructor && !userIsAdmin && (
                        <Link to="/instructor" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-stadi-green hover:bg-stadi-green-light dark:hover:bg-gray-700 transition-colors">
                          <BookOpen size={15} /> Instructor Portal
                        </Link>
                      )}
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stadi-gray dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Award size={15} /> My Learning
                      </Link>
                      <Link to="/profile" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stadi-gray dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Settings size={15} /> Profile
                      </Link>
                      <button onClick={() => { logout(); setProfileOpen(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 w-full transition-colors">
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={openAuth}
                className="btn-primary text-sm py-2 px-4 rounded-xl"
              >
                Join Free
              </button>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-stadi-gray hover:text-stadi-green rounded-lg"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 py-3 space-y-1">
            <Link to="/courses" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-stadi-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">📚 Browse Courses</Link>
            <Link to="/about" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-stadi-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">ℹ️ About Stadi</Link>
            <Link to="/careers" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-stadi-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">💼 Careers</Link>
            {/* ✅ WhatsApp prominent in mobile */}
            <a href="https://wa.me/254701901244" target="_blank" rel="noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#25D366] hover:bg-green-50 dark:hover:bg-gray-800 rounded-xl">
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-stadi-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">📊 Dashboard</Link>
                {userIsAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-semibold text-stadi-orange hover:bg-orange-50 rounded-xl">⚡ Admin</Link>}
                {userIsInstructor && !userIsAdmin && <Link to="/instructor" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-semibold text-stadi-green hover:bg-stadi-green-light rounded-xl">🎓 Instructor Portal</Link>}
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl">🚪 Logout</button>
              </>
            ) : (
              <div className="px-4 pt-2">
                <button onClick={() => { openAuth(); setMobileOpen(false); }} className="btn-primary w-full">
                  Start Earning — Join Free
                </button>
              </div>
            )}
            {/* Dark mode toggle mobile */}
            <button onClick={() => setDark(!dark)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-stadi-gray dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl w-full">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
            {/* Language select mobile */}
            <div className="px-4 pt-2">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stadi-green dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-stadi-dark dark:bg-gray-950 text-white mt-20">
      {/* Trust bar */}
      <div className="bg-stadi-green py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-6 text-sm text-white/90 font-medium">
          <span>🏛️ Aligned with KNQA Framework</span>
          <span>🎓 TVET-Compliant Content</span>
          <span>🔒 NITA-Registered Platform</span>
          <span>🇰🇪 Built for Kenya</span>
        </div>
      </div>

      {/* ✅ WhatsApp CTA band */}
      <div className="bg-[#075E54] py-5">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white text-lg flex items-center gap-2">
              <MessageCircle size={22} className="text-[#25D366]" /> Chat with us on WhatsApp
            </div>
            <p className="text-white/70 text-sm mt-0.5">Ask about courses, payments, or get learning support</p>
          </div>
          <a
            href="https://wa.me/254701901244?text=Hi%20Stadi!%20I%27d%20like%20to%20learn%20more."
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap shrink-0"
          >
            <MessageCircle size={18} /> Start Chat
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4">
            <img src={LOGO_NAV} alt="Stadi" className="h-10 w-auto bg-white rounded-lg p-1" draggable={false} />
          </div>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Learn practical vocational skills. Start earning in Kenya. In your language.
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>📍 Kisumu City, Western Kenya</div>
            <div>
              <a href="https://wa.me/254701901244" target="_blank" rel="noreferrer" className="hover:text-[#25D366] transition-colors flex items-center gap-1">
                <MessageCircle size={11} className="text-[#25D366]" /> +254 701 901 244
              </a>
            </div>
            <div>
              <a href="mailto:info@stadi.ke" className="hover:text-stadi-orange transition-colors">✉️ info@stadi.ke</a>
            </div>
          </div>
        </div>

        {/* Courses */}
        <div>
          <h4 className="font-semibold text-sm mb-4 text-gray-300">Courses</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {['Solar Installation','Phone Repair','Tailoring','Fish Processing','Poultry Farming','Boda Mechanics'].map(c => (
              <li key={c}><Link to={`/courses?q=${encodeURIComponent(c)}`} className="hover:text-stadi-orange transition-colors">{c}</Link></li>
            ))}
          </ul>
        </div>

        {/* Company — with Careers */}
        <div>
          <h4 className="font-semibold text-sm mb-4 text-gray-300">Company</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {[
              { to: '/about',               label: 'About Stadi' },
              { to: '/careers',             label: '💼 Careers' },
              { to: '/about#mission',       label: 'Our Mission' },
              { to: '/certificates/verify', label: 'Verify Certificate' },
              { to: '/teach',               label: 'Become an Instructor' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} className="hover:text-stadi-orange transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold text-sm mb-4 text-gray-300">Legal & Support</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {[
              { to: '/privacy', label: 'Privacy Policy'   },
              { to: '/terms',   label: 'Terms of Service' },
              { to: '/refund',  label: 'Refund Policy'    },
              { to: '/support', label: 'Get Support'      },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} className="hover:text-stadi-orange transition-colors">{label}</Link></li>
            ))}
          </ul>
          <div className="mt-6">
            <h4 className="font-semibold text-sm mb-2 text-gray-300">Languages</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              English · Kiswahili · Dholuo · Luhya · Kikuyu · Kalenjin · Kamba · Kisii · +7 more
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Stadi Learning Platform Ltd. All rights reserved.</span>
          <span>Registered in Kenya · ODPC Registered · <Link to="/sitemap.xml" className="hover:text-gray-300">Sitemap</Link></span>
        </div>
      </div>
    </footer>
  );
}

export function MobileBottomNav() {
  const { isLoggedIn, openAuth } = useAuthStore();
  if (!isLoggedIn) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex md:hidden">
      {[
        { to: '/',         icon: Home,     label: 'Home'     },
        { to: '/courses',  icon: Search,   label: 'Explore'  },
        { to: '/dashboard/bookmarks', icon: Heart, label: 'Saved' },
        { to: '/dashboard',icon: BookOpen, label: 'Learning' },
        { to: '/profile',  icon: User,     label: 'Profile'  },
      ].map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors
            ${isActive ? 'text-stadi-green' : 'text-gray-400 hover:text-stadi-green'}`}
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-950 transition-colors">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
