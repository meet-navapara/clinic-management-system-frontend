import { Link } from 'react-router-dom';
import { LOGO_URL, BRAND_NAME, BRAND_TAGLINE } from '../../constants/branding';
import { ROUTES } from '../../constants/routes';
import { LANDING_IMAGES } from '../../constants/landingImages';
import LandingProductPreview from './LandingProductPreview';

export default function LandingHero() {
  return (
    <section className="hero-section landing-hero landing-hero--photo relative">
      <div className="landing-hero-media absolute inset-0" aria-hidden>
        <img
          src={LANDING_IMAGES.hero}
          alt=""
          className="landing-hero-photo"
          width={2400}
          height={1600}
          decoding="async"
          fetchPriority="high"
        />
        <div className="landing-hero-photo-veil" />
      </div>

      <div className="relative site-container flex flex-1 flex-col justify-center pt-10 sm:pt-12 md:pt-14 pb-10 sm:pb-14 md:pb-16">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <img
            src={LOGO_URL}
            alt=""
            className="landing-hero-item landing-hero-item-1 h-auto w-auto max-h-[4.25rem] xs:max-h-[5rem] sm:max-h-[5.75rem] md:max-h-[6.5rem] max-w-[min(100%,16rem)] sm:max-w-[min(100%,20rem)] object-contain drop-shadow-sm"
            draggable={false}
          />

          <p className="landing-hero-item landing-hero-item-2 mt-5 sm:mt-6 section-label text-accent-700">
            {BRAND_TAGLINE}
          </p>

          <h1 className="landing-hero-item landing-hero-item-3 mt-3 sm:mt-4 font-serif font-bold tracking-tight text-ink text-[1.65rem] leading-[1.15] xs:text-3xl sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
            {BRAND_NAME}
            <span className="block mt-1.5 sm:mt-2 text-[1.05rem] xs:text-xl sm:text-2xl md:text-[1.85rem] font-semibold text-ink/90">
              Clinic software for the full patient visit
            </span>
          </h1>

          <p className="landing-hero-item landing-hero-item-4 mt-3 sm:mt-4 text-ink-muted text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed px-1">
            Register patients, run the day calendar and live queue, consult, bill, and follow up — one workspace for
            doctors and staff.
          </p>

          <div className="landing-hero-item landing-hero-item-5 mt-6 sm:mt-8 flex flex-col xs:flex-row items-stretch xs:items-center justify-center gap-2.5 sm:gap-3 w-full xs:w-auto px-1">
            <Link to={ROUTES.doctorSignup} className="btn-gold justify-center min-w-[10.5rem]">
              Create account
            </Link>
            <Link to={ROUTES.login} className="btn-secondary justify-center min-w-[10.5rem] bg-white/90">
              Login
            </Link>
          </div>
        </div>

        <div className="landing-hero-item landing-hero-item-5 mt-10 sm:mt-12 md:mt-14 w-full max-w-5xl mx-auto">
          <LandingProductPreview />
        </div>
      </div>
    </section>
  );
}
