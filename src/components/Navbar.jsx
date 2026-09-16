import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Leaf } from 'lucide-react';
import { LOGO_URL, APP_NAME } from '../constants/branding';
import { ROUTES } from '../constants/routes';

const linkClass = ({ isActive }) =>
  `px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium min-h-9 sm:min-h-10 inline-flex items-center ${
    isActive ? 'bg-[#f3efe8] text-ink' : 'text-ink-muted hover:text-ink hover:bg-[#faf8f3]'
  }`;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-line sticky top-0 z-50 w-full">
      <div className="site-container">
        <div className="flex items-center justify-between gap-2 h-14 min-w-0">
          <Link to="/" className="navbar-brand min-w-0" onClick={closeMenu} aria-label={APP_NAME}>
            {!logoError ? (
              <img
                src={LOGO_URL}
                alt=""
                className="navbar-brand-emblem-img"
                draggable={false}
                onError={() => setLogoError(true)}
              />
            ) : (
              <Leaf className="w-5 h-5 text-accent-600 shrink-0" />
            )}
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink to={ROUTES.login} className={linkClass}>
              Login
            </NavLink>
            <Link to={ROUTES.doctorSignup} className="btn-primary ml-1">
              Sign up
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-ink-muted"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-line px-4 py-3 space-y-2 bg-white">
          <Link to={ROUTES.login} onClick={closeMenu} className="block text-center px-4 py-3 text-sm font-medium">
            Login
          </Link>
          <Link to={ROUTES.doctorSignup} onClick={closeMenu} className="btn-primary block text-center w-full">
            Sign up
          </Link>
        </div>
      )}
    </nav>
  );
}
