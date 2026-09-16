import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ListOrdered,
  Receipt,
  Stethoscope,
  Users,
  Warehouse,
  ChevronDown,
} from 'lucide-react';
import { LOGO_URL, BRAND_NAME } from '../constants/branding';
import { ROUTES } from '../constants/routes';
import Reveal from '../components/Reveal';

const FLOW = [
  { step: '01', title: 'Register', text: 'Add or find the patient with history and contacts.' },
  { step: '02', title: 'Schedule', text: 'Book on the calendar or check in to the live queue.' },
  { step: '03', title: 'Consult', text: 'Notes, consent, prescription, and optional invoice.' },
  { step: '04', title: 'Collect', text: 'Payments post to billing and revenue by branch.' },
  { step: '05', title: 'Follow up', text: 'Reminders and campaigns stay inside Z Health.' },
];

const HIGHLIGHTS = [
  {
    icon: Users,
    title: 'Patients',
    text: 'Registration, history, and a clear visit record.',
  },
  {
    icon: CalendarDays,
    title: 'Appointments',
    text: 'Day calendar from scheduled to completed.',
  },
  {
    icon: ListOrdered,
    title: 'Queue',
    text: 'Check-in and a live waiting-room display.',
  },
  {
    icon: Stethoscope,
    title: 'Consultation',
    text: 'Notes, prescription, and follow-up in one visit.',
  },
  {
    icon: Receipt,
    title: 'Billing',
    text: 'Invoices and payments tied to the clinic day.',
  },
  {
    icon: Warehouse,
    title: 'Inventory',
    text: 'Branch stock and expiry for the pharmacy desk.',
  },
];

export default function Landing() {
  return (
    <div className="w-full flex-1 overflow-x-hidden bg-[#FFFEFE]">
      <section className="hero-section landing-hero relative">
        <div
          className="landing-hero-atmosphere absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.18), transparent 58%), radial-gradient(ellipse 50% 40% at 85% 70%, rgba(28,36,48,0.06), transparent 55%), linear-gradient(180deg, #f3efe6 0%, #FFFEFE 55%, #FFFEFE 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          aria-hidden
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%231c2430\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />

        <div className="relative site-container flex flex-1 flex-col items-center justify-center text-center py-10 sm:py-12">
          <img
            src={LOGO_URL}
            alt={`${BRAND_NAME} logo`}
            className="landing-hero-item landing-hero-item-1 h-auto w-auto max-h-[5.5rem] xs:max-h-28 sm:max-h-36 md:max-h-44 max-w-[min(100%,18rem)] sm:max-w-[min(100%,26rem)] object-contain"
          />
          <h1 className="sr-only">{BRAND_NAME}</h1>
          <p className="landing-hero-item landing-hero-item-2 mt-5 sm:mt-6 text-ink-muted text-sm sm:text-base md:text-lg max-w-lg mx-auto leading-relaxed px-1">
            Clinic management for patients, appointments, queue, consultation, and billing — in one workspace.
          </p>
        </div>

        <a
          href="#clinic-day"
          className="landing-scroll-cue absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 inline-flex flex-col items-center gap-1 text-ink-faint hover:text-ink-muted transition-colors"
          aria-label="Scroll to next section"
        >
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em]">Scroll</span>
          <ChevronDown className="w-4 h-4" aria-hidden />
        </a>
      </section>

      <section id="clinic-day" className="py-12 sm:py-16 md:py-20 bg-[#FFFEFE] scroll-mt-16">
        <div className="site-container">
          <Reveal>
            <p className="section-label mb-2">A clinic day</p>
            <h2 className="page-title mb-2">From registration to follow-up</h2>
            <p className="text-ink-muted mb-8 sm:mb-10 max-w-2xl text-sm sm:text-base">
              Front desk, doctor, and accounts stay on the same path.
            </p>
          </Reveal>
          <ol className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-0 list-none p-0 m-0 border-t border-line">
            {FLOW.map((item, i) => (
              <Reveal
                as="li"
                key={item.step}
                delay={i * 70}
                className="border-b lg:border-b-0 lg:border-r border-line last:border-r-0 py-5 lg:pr-5 lg:pl-5 first:lg:pl-0 min-w-0"
              >
                <p className="text-[11px] font-semibold tracking-wider text-accent-700">{item.step}</p>
                <h3 className="mt-1.5 text-sm sm:text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-xs sm:text-sm text-ink-muted leading-relaxed">{item.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-[#f7f4ef]">
        <div className="site-container">
          <Reveal>
            <p className="section-label mb-2">Workspace</p>
            <h2 className="page-title mb-2">What you run after login</h2>
            <p className="text-ink-muted mb-8 sm:mb-10 max-w-2xl text-sm sm:text-base">
              Core modules for practice, front desk, clinical care, and operations.
            </p>
          </Reveal>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-7 list-none p-0 m-0">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={(i % 3) * 60} className="min-w-0 flex gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-accent-700 ring-1 ring-line">
                  <Icon className="w-4 h-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-ink-muted leading-relaxed">{text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="get-started" className="py-14 sm:py-16 md:py-20 bg-[#1c2430] text-white scroll-mt-16">
        <Reveal className="site-container text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">Get started</h2>
          <p className="mt-3 text-sm sm:text-base text-white/70 max-w-md mx-auto leading-relaxed">
            Sign in to your clinic workspace, or create a doctor account.
          </p>
          <div className="mt-7 flex flex-col xs:flex-row items-stretch xs:items-center justify-center gap-2.5 sm:gap-3">
            <Link to={ROUTES.doctorSignup} className="btn-gold justify-center">
              Create account
            </Link>
            <Link to={ROUTES.login} className="btn-outline-light justify-center">
              Login
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line bg-white py-6 sm:py-8">
        <div className="site-container flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-ink-muted">
          <p>
            © {new Date().getFullYear()} {BRAND_NAME}
          </p>
          <div className="flex items-center gap-4">
            <Link to={ROUTES.login} className="hover:text-ink transition-colors">
              Login
            </Link>
            <Link to={ROUTES.doctorSignup} className="hover:text-ink transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
