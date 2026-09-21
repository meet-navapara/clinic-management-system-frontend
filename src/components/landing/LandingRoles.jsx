import { Link } from 'react-router-dom';
import Reveal from '../Reveal';
import { ROUTES } from '../../constants/routes';
import { LANDING_IMAGES } from '../../constants/landingImages';

const ROLES = [
  {
    title: 'Doctors',
    text: 'Own the clinic workspace: patients, calendar, consultation, billing, branches, staff, and campaigns. New doctor accounts go through approval before full access.',
    cta: { to: ROUTES.doctorSignup, label: 'Create doctor account' },
    image: LANDING_IMAGES.doctor,
    alt: 'Doctor in a professional clinic setting',
  },
  {
    title: 'Staff',
    text: 'Front desk and operations roles with permissions you assign — appointments, queue, patients, billing, and more — without sharing the doctor login.',
    cta: { to: ROUTES.login, label: 'Staff login' },
    image: LANDING_IMAGES.staff,
    alt: 'Clinic staff members working together',
  },
];

export default function LandingRoles() {
  return (
    <section className="py-14 sm:py-20 md:py-24 bg-[#FFFEFE]">
      <div className="site-container">
        <Reveal>
          <p className="section-label mb-2">Built for the clinic team</p>
          <h2 className="landing-section-title mb-2">Doctors and staff, clear roles</h2>
          <p className="text-ink-muted mb-9 sm:mb-12 max-w-2xl text-sm sm:text-base leading-relaxed">
            Z Health is designed around how clinics actually work — not a single shared inbox for everyone.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {ROLES.map(({ title, text, cta, image, alt }, i) => (
            <Reveal key={title} delay={i * 80} className="landing-role-card min-w-0 flex flex-col border border-line bg-[#FFFEFE] overflow-hidden">
              <div className="landing-role-photo">
                <img src={image} alt={alt} width={1200} height={800} loading="lazy" decoding="async" />
              </div>
              <div className="p-6 sm:p-8 flex flex-col flex-1">
                <h3 className="text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed flex-1">{text}</p>
                <Link to={cta.to} className="btn-secondary mt-6 self-start">
                  {cta.label}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
