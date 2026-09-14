import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  GitBranch,
  IndianRupee,
  Package,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { LOGO_URL, BRAND_NAME } from '../constants/branding';
import { ROUTES } from '../constants/routes';

const FEATURES = [
  {
    icon: Users,
    title: 'Patients & visits',
    text: 'Register patients, keep clinical history, and schedule follow-ups in one place.',
  },
  {
    icon: CalendarDays,
    title: 'Appointments & queue',
    text: 'Day calendar, check-in queue, and reminders so the front desk stays ahead.',
  },
  {
    icon: GitBranch,
    title: 'Multi-branch clinics',
    text: 'Isolate patients, stock, and revenue by branch while doctors see the full clinic.',
  },
  {
    icon: IndianRupee,
    title: 'Billing & revenue',
    text: 'Invoices, payments, and branch-wise collections without leaving the workflow.',
  },
  {
    icon: Package,
    title: 'Medicine & inventory',
    text: 'Clinic-wide medicine master with branch-specific stock and expiry awareness.',
  },
  {
    icon: ShieldCheck,
    title: 'Staff permissions',
    text: 'Give reception, nursing, and assistants only the modules and branch they need.',
  },
];

export default function Landing() {
  return (
    <div className="w-full flex-1 overflow-x-hidden">
      <section className="hero-section min-h-[calc(100dvh-3.5rem)] flex items-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.12),_transparent_55%)] pointer-events-none" aria-hidden />
        <div className="relative site-container py-16 sm:py-24 text-center animate-[fadeIn_0.6s_ease-out]">
          <img
            src={LOGO_URL}
            alt={`${BRAND_NAME} logo`}
            className="h-16 sm:h-20 w-auto mx-auto mb-6 object-contain"
          />
          <h1 className="hero-title text-4xl sm:text-5xl text-white mb-2">{BRAND_NAME}</h1>
          <p className="text-accent-300 uppercase tracking-[0.22em] text-xs font-semibold mb-5">
            Clinic management
          </p>
          <p className="text-white/70 text-base max-w-md mx-auto mb-8">
            Practice software for Ayurveda clinics — patients, appointments, billing, inventory, and staff access.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to={ROUTES.login} className="btn-gold">
              Doctor login <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link to={ROUTES.doctorSignup} className="btn-outline-light">
              Sign up
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f4ef] py-14 sm:py-20">
        <div className="site-container">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              Built for how clinics actually run
            </h2>
            <p className="text-ink-muted mt-2 text-sm sm:text-base">
              One doctor-led workspace with branch isolation, permission-based staff, and the daily tools your team already uses.
            </p>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 list-none p-0 m-0">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="min-w-0">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-accent-700 ring-1 ring-black/5">
                    <Icon className="w-4 h-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{title}</h3>
                    <p className="text-sm text-ink-muted mt-1 leading-relaxed">{text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link to={ROUTES.doctorSignup} className="btn-primary">
              Start your clinic
            </Link>
            <p className="text-xs text-ink-faint inline-flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" aria-hidden />
              Doctor accounts require admin approval before dashboard access.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 bg-white py-8">
        <div className="site-container flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-ink-muted">
          <p>
            © {new Date().getFullYear()} {BRAND_NAME}
          </p>
          <div className="flex gap-4">
            <Link to={ROUTES.login} className="hover:text-ink">
              Sign in
            </Link>
            <Link to={ROUTES.doctorSignup} className="hover:text-ink">
              Doctor sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
