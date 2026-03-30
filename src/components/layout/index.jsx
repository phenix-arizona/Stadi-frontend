import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, Bell, Menu, X, Home, Search, Heart, Award,
  User, LogOut, Settings, ChevronDown, Flame, Wifi, WifiOff,
} from 'lucide-react';
import useAuthStore from '../../store/auth.store';
import useAppStore  from '../../store/app.store';
import { Badge }    from '../ui';
import { LOGO_NAV, LOGO_ICON } from '../../assets/logo';

const LANGUAGES = [
  { code: 'english', label: 'English' },
  { code: 'swahili', label: 'Kiswahili' },
  { code: 'dholuo',  label: 'Dholuo' },
  { code: 'luhya',   label: 'Luhya' },
  { code: 'kikuyu',  label: 'Kikuyu' },
  { code: 'kalenjin',label: 'Kalenjin' },
  { code: 'kamba',   label: 'Kamba' },
  { code: 'kisii',   label: 'Kisii' },
];

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (!offline) return null;
  return (
    <div className="bg-amber-500 text-white text-xs font-semibold text-center py-2 flex items-center justify-center gap-2">
      <WifiOff size={13} /> You're offline — showing saved content. Some features may be limited.
    </div>
  );
}

export function Navbar() {
  const { user, isLoggedIn, openAuth, logout, isAdmin } = useAuthStore();
  const { language, setLanguage } = useAppStore();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [langOpen,     setLangOpen]     = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <OfflineBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img
              src={LOGO_NAV}
              alt="Stadi — Learn Skills. Start Earning."
              className="h-9 w-auto"
              draggable={false}
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/courses" className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-stadi-green' : 'text-stadi-gray hover:text-stadi-green'}`}>
              Browse Courses
            </NavLink>
            <NavLink to="/about" className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-stadi-green' : 'text-stadi-gray hover:text-stadi-green'}`}>
              About Stadi
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className="text-sm font-medium text-stadi-orange hover:text-stadi-green">
                Admin
              </NavLink>
            )}
            {(user?.role === 'instructor' || isAdmin) && (
              <NavLink to="/instructor" className="text-sm font-medium text-stadi-green hover:text-stadi-green/70">
                Instructor
              </NavLink>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-stadi-green"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-gray-400">
                  <X size={16} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 text-stadi-gray hover:text-stadi-green rounded-lg hover:bg-gray-50">
                <Search size={18} />
              </button>
            )}

            {/* Language selector */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 text-xs font-medium text-stadi-gray hover:text-stadi-green px-2 py-1.5 rounded-lg hover:bg-gray-50"
              >
                🌍 {LANGUAGES.find(l => l.code === language)?.label || 'English'}
                <ChevronDown size={12} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 w-36">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-stadi-green-light transition-colors
                        ${language === l.code ? 'text-stadi-green font-semibold' : 'text-stadi-gray'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <>
                <Link to="/dashboard/notifications" className="p-2 text-stadi-gray hover:text-stadi-green rounded-lg hover:bg-gray-50 relative">
                  <Bell size={18} />
                </Link>
                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-stadi-green-light flex items-center justify-center text-stadi-green font-bold text-sm">
                      {user?.name?.[0]?.toUpperCase() || user?.phone?.slice(-2)}
                    </div>
                    <span className="text-sm font-medium text-stadi-dark hidden md:block max-w-[100px] truncate">
                      {user?.name || 'My Account'}
                    </span>
                    <ChevronDown size={13} className="text-gray-400 hidden md:block" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 w-52 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <div className="font-semibold text-stadi-dark text-sm truncate">{user?.name || 'Learner'}</div>
                        <div className="text-xs text-stadi-gray">{user?.phone}</div>
                      </div>
                      {[
                        { to: '/dashboard', icon: Home, label: 'Dashboard' },
                        { to: '/dashboard/bookmarks', icon: Heart, label: 'Bookmarks' },
                        { to: '/dashboard/certificates', icon: Award, label: 'Certificates' },
                        { to: '/dashboard/streak', icon: Flame, label: 'My Streak' },
                        { to: '/profile', icon: Settings, label: 'Profile Settings' },
                      ].map(({ to, icon: Icon, label }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-stadi-gray hover:bg-stadi-green-light hover:text-stadi-green transition-colors"
                        >
                          <Icon size={15} />
                          {label}
                        </Link>
                      ))}
                      <hr className="border-gray-100 my-1" />
                      <button
                        onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={openAuth}
                  className="text-sm font-semibold text-stadi-green hover:underline px-3 py-2"
                >
                  Log in
                </button>
                <button
                  onClick={openAuth}
                  className="btn-primary text-sm py-2 px-4"
                >
                  Start Earning
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-stadi-gray"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1 animate-fade-in">
            {[
              { to: '/',        label: '🏠 Home' },
              { to: '/courses', label: '📚 Browse Courses' },
              { to: '/about',   label: 'ℹ️ About Stadi' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-stadi-dark hover:bg-stadi-green-light hover:text-stadi-green rounded-xl transition-colors"
              >
                {label}
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-stadi-dark hover:bg-gray-50 rounded-xl">📊 Dashboard</Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-4 py-3 text-sm font-medium text-red-500">🚪 Logout</button>
              </>
            ) : (
              <div className="px-4 pt-2">
                <button onClick={() => { openAuth(); setMobileOpen(false); }} className="btn-primary w-full">
                  Start Earning — Join Stadi
                </button>
              </div>
            )}
            {/* Language select mobile */}
            <div className="px-4 pt-2">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stadi-green"
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
    <footer className="bg-stadi-dark text-white mt-20">
      {/* Trust bar */}
      <div className="bg-stadi-green py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-6 text-sm text-white/90 font-medium">
          <span className="flex items-center gap-2">🏛️ Aligned with KNQA Framework</span>
          <span className="flex items-center gap-2">🎓 TVET-Compliant Content</span>
          <span className="flex items-center gap-2">🔒 NITA-Registered Platform</span>
          <span className="flex items-center gap-2">🇰🇪 Built for Kenya</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4">
            <img
              src={LOGO_NAV}
              alt="Stadi"
              className="h-10 w-auto brightness-0 invert"
              draggable={false}
            />
          </div>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Learn practical vocational skills. Start earning in Kenya. In your language.
          </p>
          <div className="text-xs text-gray-500">
            <div>📍 Kisumu City, Western Kenya</div>
            <div className="mt-1">📱 WhatsApp: +254 700 000 000</div>
            <div className="mt-1">✉️ info@stadi.co.ke</div>
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

        {/* Company */}
        <div>
          <h4 className="font-semibold text-sm mb-4 text-gray-300">Company</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {[
              { to: '/about', label: 'About Stadi' },
              { to: '/about#mission', label: 'Our Mission' },
              { to: '/certificates/verify', label: 'Verify Certificate' },
              { to: '/teach', label: 'Become an Instructor' },
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
              { to: '/privacy', label: 'Privacy Policy' },
              { to: '/terms',   label: 'Terms of Service' },
              { to: '/refund',  label: 'Refund Policy' },
              { to: '/support', label: 'Get Support' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} className="hover:text-stadi-orange transition-colors">{label}</Link></li>
            ))}
          </ul>
          <div className="mt-6">
            <h4 className="font-semibold text-sm mb-3 text-gray-300">Languages</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              English · Kiswahili · Dholuo · Luhya · Kikuyu · Kalenjin · Kamba · Kisii · +7 more
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Stadi Learning Platform Ltd. All rights reserved.</span>
          <span>Registered in Kenya | KRA PIN: [To be added] | ODPC Registered</span>
        </div>
      </div>
    </footer>
  );
}

export function MobileBottomNav() {
  const { isLoggedIn, openAuth } = useAuthStore();
  if (!isLoggedIn) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex md:hidden">
      {[
        { to: '/',                    icon: Home,    label: 'Home' },
        { to: '/courses',             icon: Search,  label: 'Explore' },
        { to: '/dashboard/bookmarks', icon: Heart,   label: 'Saved' },
        { to: '/dashboard',           icon: BookOpen,label: 'Learning' },
        { to: '/profile',             icon: User,    label: 'Profile' },
      ].map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
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

// ── Page Layout wrapper ────────────────────────────────────────
export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
