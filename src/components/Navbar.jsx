import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Leaf } from 'lucide-react';
import { LOGO_URL, APP_NAME } from '../constants/branding';
import { ROUTES } from '../constants/routes';

const LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#roles', label: 'For clinics' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const onLanding = pathname === ROUTES.home;
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!onLanding) return undefined;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onLanding]);

  return (
    <nav className={`lp-nav ${scrolled || !onLanding ? 'is-solid' : ''}`}>
      <div className="site-container lp-nav-inner">
        <Link to="/" className="navbar-brand min-w-0" onClick={closeMenu} aria-label={APP_NAME}>
          {!logoError ? (
            <img src={LOGO_URL} alt="" className="navbar-brand-emblem-img" draggable={false} onError={() => setLogoError(true)} />
          ) : (
            <Leaf className="w-5 h-5 text-accent-600 shrink-0" />
          )}
        </Link>

        <div className="lp-nav-desk">
          {onLanding && LINKS.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
          <Link to={ROUTES.login}>Login</Link>
          <Link to={ROUTES.doctorSignup} className="btn-primary">Get started</Link>
        </div>

        <button
          type="button"
          className="lp-nav-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="lp-nav-mobile">
          {onLanding && LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>{link.label}</a>
          ))}
          <Link to={ROUTES.login} onClick={closeMenu}>Login</Link>
          <Link to={ROUTES.doctorSignup} onClick={closeMenu} className="btn-primary w-full">Get started</Link>
        </div>
      )}
    </nav>
  );
}
