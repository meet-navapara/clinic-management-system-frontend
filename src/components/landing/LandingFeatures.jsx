import {
  CalendarDays,
  ListOrdered,
  Receipt,
  Stethoscope,
  Users,
  GitBranch,
  Megaphone,
  FileText,
  IndianRupee,
  Search,
} from 'lucide-react';
import Reveal from '../Reveal';
import { LANDING_IMAGES } from '../../constants/landingImages';

const CORE = [
  {
    icon: Users,
    title: 'Patients',
    text: 'Registration, history, and a clear visit record your whole team can open.',
  },
  {
    icon: CalendarDays,
    title: 'Appointments',
    text: 'Day calendar from scheduled to completed, with booking from the front desk or doctor.',
  },
  {
    icon: ListOrdered,
    title: 'Queue',
    text: 'Check-in tokens and a live waiting-room display kept in sync with the clinic floor.',
  },
  {
    icon: Stethoscope,
    title: 'Consultation',
    text: 'Notes, consent, prescription, and printables in one appointment workspace.',
  },
];

const MORE = [
  {
    icon: Receipt,
    title: 'Billing',
    text: 'Invoices and payments tied to the clinic day.',
  },
  {
    icon: IndianRupee,
    title: 'Revenue',
    text: 'Collections viewed by branch when you run more than one location.',
  },
  {
    icon: GitBranch,
    title: 'Branches & staff',
    text: 'Multi-location scope with role-based staff permissions.',
  },
  {
    icon: Megaphone,
    title: 'Campaigns',
    text: 'WhatsApp and email outreach with clinic-approved templates.',
  },
  {
    icon: FileText,
    title: 'Consent & templates',
    text: 'Capture consent and reuse clinical templates without leaving the visit.',
  },
  {
    icon: Search,
    title: 'Search',
    text: 'Find patients and visits quickly across the clinic record.',
  },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-14 sm:py-20 md:py-24 bg-[#f7f4ef] scroll-mt-16">
      <div className="site-container">
        <Reveal>
          <p className="section-label mb-2">Workspace</p>
          <h2 className="landing-section-title mb-2">What you run after login</h2>
          <p className="text-ink-muted mb-8 sm:mb-10 max-w-2xl text-sm sm:text-base leading-relaxed">
            The same modules doctors and staff use in production — practice, front desk, clinical care, and operations.
          </p>
        </Reveal>

        <Reveal className="landing-features-banner mb-8 sm:mb-10">
          <img
            src={LANDING_IMAGES.waiting}
            alt="Clinic waiting area representing the live queue experience"
            width={1600}
            height={900}
            loading="lazy"
            decoding="async"
          />
        </Reveal>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 list-none p-0 m-0 mb-4 sm:mb-5">
          {CORE.map(({ icon: Icon, title, text }, i) => (
            <Reveal
              as="li"
              key={title}
              delay={(i % 2) * 80}
              className="landing-feature-tile min-w-0 bg-[#FFFEFE] border border-line p-5 sm:p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#f7f4ef] text-accent-700 ring-1 ring-line">
                <Icon className="w-[18px] h-[18px]" aria-hidden />
              </span>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">{text}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal>
          <p className="section-label mb-4 mt-8 sm:mt-10">Also in the clinic</p>
        </Reveal>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 list-none p-0 m-0">
          {MORE.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={(i % 3) * 50} className="min-w-0 flex gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#FFFEFE] text-accent-700 ring-1 ring-line">
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
  );
}
