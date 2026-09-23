import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { LOGO_URL, APP_NAME } from '../constants/branding';
import { ROUTES } from '../constants/routes';

const LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#roles', label: 'For clinics' },
];

const PUBLIC_LOGO = '/brand/Z-Health-logo-clear.png';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState(LOGO_URL || PUBLIC_LOGO);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const onLanding = pathname === ROUTES.home;
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  return (
    <>
      <header className={`lp-nav-shell ${scrolled ? 'is-scrolled' : ''} ${menuOpen ? 'is-open' : ''}`}>
        <nav className="lp-nav-pill" aria-label="Primary">
          <Link to="/" className="lp-nav-brand" onClick={closeMenu} aria-label={APP_NAME}>
            {logoSrc ? (
              <img
                src={logoSrc}
                alt=""
                className="lp-nav-logo"
                draggable={false}
                onError={() => {
                  if (logoSrc !== PUBLIC_LOGO) setLogoSrc(PUBLIC_LOGO);
                  else setLogoSrc('');
                }}
              />
            ) : (
              <span className="lp-nav-brand-name">{APP_NAME}</span>
            )}
          </Link>

          <div className="lp-nav-desk">
            {onLanding &&
              LINKS.map((link) => (
                <a key={link.href} href={link.href} className="lp-nav-link">
                  {link.label}
                </a>
              ))}
          </div>

          <div className="lp-nav-actions">
            <Link to={ROUTES.login} className="lp-nav-link lp-nav-login">
              Log in
            </Link>
            <Link to={ROUTES.doctorSignup} className="lp-nav-cta">
              Sign up
            </Link>
            <button
              type="button"
              className="lp-nav-toggle"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" strokeWidth={1.75} /> : <Menu className="w-5 h-5" strokeWidth={1.75} />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="lp-nav-mobile">
            {onLanding &&
              LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              ))}
            <Link to={ROUTES.login} onClick={closeMenu}>
              Log in
            </Link>
            <Link to={ROUTES.doctorSignup} onClick={closeMenu} className="lp-nav-cta lp-nav-cta--block">
              Sign up
            </Link>
          </div>
        )}
      </header>
      <div className="lp-nav-spacer" aria-hidden="true" />
    </>
  );
}
