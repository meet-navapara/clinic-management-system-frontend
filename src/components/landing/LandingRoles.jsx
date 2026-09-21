import { Link } from 'react-router-dom';
import Reveal from '../Reveal';
import { ROUTES } from '../../constants/routes';
import { LANDING_IMAGES } from '../../constants/landingImages';

const ROLES = [
  {
    title: 'Doctors',
    text: 'The practice owner. Patients, calendar, queue, consultation, billing, branches, staff, and campaigns. New accounts wait for approval before full access.',
    cta: { to: ROUTES.doctorSignup, label: 'Create doctor account' },
    image: LANDING_IMAGES.doctor,
    alt: 'Doctor in a clinic',
    chips: ['Dashboard', 'Consult', 'Billing'],
  },
  {
    title: 'Staff',
    text: 'Front desk and operations. Appointments, queue, patients, and billing only where a doctor grants permission — a separate login, not a shared password.',
    cta: { to: ROUTES.login, label: 'Staff login' },
    image: LANDING_IMAGES.frontDesk,
    alt: 'Clinic front desk staff managing appointments',
    chips: ['Front desk', 'Queue', 'Check-in'],
  },
];

export default function LandingRoles() {
  return (
    <section id="roles" className="lp-roles">
      <div className="site-container">
        <Reveal className="lp-section-head">
          <p className="lp-kicker">Who it is for</p>
          <h2>Two ways into the same clinic.</h2>
        </Reveal>
        <div className="lp-roles-grid lp-roles-grid--two">
          {ROLES.map((role, i) => (
            <Reveal key={role.title} delay={i * 70} className="lp-role">
              <div className="lp-role-photo">
                <img src={role.image} alt={role.alt} loading="lazy" decoding="async" />
              </div>
              <div className="lp-role-body">
                <div className="lp-chips">
                  {role.chips.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
                <h3>{role.title}</h3>
                <p>{role.text}</p>
                <Link to={role.cta.to} className="btn-secondary">
                  {role.cta.label}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
