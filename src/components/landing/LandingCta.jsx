import { Link } from 'react-router-dom';
import Reveal from '../Reveal';
import { ROUTES } from '../../constants/routes';
import { LANDING_IMAGES } from '../../constants/landingImages';

export default function LandingCta() {
  return (
    <section id="get-started" className="landing-cta relative overflow-hidden text-white scroll-mt-16">
      <img
        src={LANDING_IMAGES.consult}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        width={1600}
        height={1067}
        loading="lazy"
        decoding="async"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#1c2430]/88" aria-hidden />

      <Reveal className="relative site-container text-center py-16 sm:py-20 md:py-24">
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">
          Get started
        </p>
        <h2 className="mt-3 font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
          Open your clinic workspace
        </h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-white/70 max-w-md mx-auto leading-relaxed">
          Create a doctor account for your clinic, or sign in if you already have access.
        </p>
        <div className="mt-8 flex flex-col xs:flex-row items-stretch xs:items-center justify-center gap-2.5 sm:gap-3">
          <Link to={ROUTES.doctorSignup} className="btn-gold justify-center">
            Create account
          </Link>
          <Link to={ROUTES.login} className="btn-outline-light justify-center">
            Login
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
