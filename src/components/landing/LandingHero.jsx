import { Link } from 'react-router-dom';
import { BRAND_TAGLINE } from '../../constants/branding';
import { ROUTES } from '../../constants/routes';
import { LANDING_IMAGES } from '../../constants/landingImages';
import LandingProductPreview from './LandingProductPreview';

export default function LandingHero() {
  return (
    <section id="product" className="lp-hero">
      <img src={LANDING_IMAGES.hero} alt="" className="lp-hero-bg" width={2400} height={1600} decoding="async" fetchPriority="high" />
      <div className="lp-hero-veil" aria-hidden />

      <div className="site-container lp-hero-grid">
        <div className="lp-hero-copy">
          <p className="lp-eyebrow">{BRAND_TAGLINE}</p>
          <h1>
            Run the full clinic day
            <span> from check-in to follow-up.</span>
          </h1>
          <p className="lp-lead">
            Z Health is the workspace doctors and staff share: patients, the day calendar, a live queue, consultation, billing, and WhatsApp or email follow-up.
          </p>
          <div className="lp-cta-row">
            <Link to={ROUTES.doctorSignup} className="btn-gold justify-center">Create doctor account</Link>
            <Link to={ROUTES.login} className="btn-secondary justify-center bg-white/90">Login</Link>
          </div>
          <ul className="lp-hero-points">
            <li>Appointments & live queue</li>
            <li>Consultation & billing</li>
            <li>Branches, staff, campaigns</li>
          </ul>
        </div>

        <div className="lp-hero-stage">
          <LandingProductPreview />
          <aside className="lp-float" aria-hidden>
            <span>Waiting room</span>
            <strong>Now serving A-04</strong>
            <small>Next · A-05</small>
          </aside>
        </div>
      </div>
    </section>
  );
}
