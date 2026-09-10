import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LOGO_URL, BRAND_NAME } from '../constants/branding';
import { ROUTES } from '../constants/routes';

export default function Landing() {
  return (
    <div className="w-full flex-1 overflow-x-hidden">
      <section className="hero-section min-h-[calc(100dvh-3.5rem)] flex items-center">
        <div className="relative site-container py-16 sm:py-24 text-center">
          <img
            src={LOGO_URL}
            alt=""
            className="h-16 sm:h-20 w-auto mx-auto mb-6 object-contain"
          />
          <h1 className="hero-title text-4xl sm:text-5xl text-white mb-2">{BRAND_NAME}</h1>
          <p className="text-accent-300 uppercase tracking-[0.22em] text-xs font-semibold mb-5">
            Ayurveda
          </p>
          <p className="text-white/70 text-base max-w-md mx-auto mb-8">
            Add patients, schedule visits, and manage reminders from a calm doctor workspace.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to={ROUTES.login} className="btn-gold">
              Doctor login <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to={ROUTES.doctorSignup} className="btn-outline-light">
              Sign up
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
