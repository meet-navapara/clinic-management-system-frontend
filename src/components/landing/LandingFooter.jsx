import { Link } from 'react-router-dom';
import { BRAND_NAME, BRAND_TAGLINE } from '../../constants/branding';
import { ROUTES } from '../../constants/routes';

export default function LandingFooter() {
  return (
    <footer className="border-t border-line bg-white py-8 sm:py-10">
      <div className="site-container flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="min-w-0">
          <p className="font-serif text-lg font-bold text-ink">{BRAND_NAME}</p>
          <p className="mt-1 text-xs sm:text-sm text-ink-muted">{BRAND_TAGLINE}</p>
          <p className="mt-4 text-xs text-ink-faint">
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-ink-muted" aria-label="Footer">
          <a href="#features" className="hover:text-ink transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-ink transition-colors">
            How it works
          </a>
          <Link to={ROUTES.login} className="hover:text-ink transition-colors">
            Login
          </Link>
          <Link to={ROUTES.doctorSignup} className="hover:text-ink transition-colors">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
