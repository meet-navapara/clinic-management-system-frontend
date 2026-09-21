import { Link } from 'react-router-dom';
import Reveal from '../Reveal';
import { ROUTES } from '../../constants/routes';
import { LANDING_IMAGES } from '../../constants/landingImages';

export default function LandingCta() {
  return (
    <section id="get-started" className="lp-final">
      <img src={LANDING_IMAGES.consult} alt="" aria-hidden />
      <div className="lp-final-veil" aria-hidden />
      <Reveal className="site-container lp-final-copy">
        <p className="lp-kicker lp-kicker--light">Get started</p>
        <h2>Open the clinic workspace your desk and doctors can share.</h2>
        <p>Create a doctor account for your practice, or sign in if you already have access.</p>
        <div className="lp-cta-row">
          <Link to={ROUTES.doctorSignup} className="btn-gold justify-center">Create doctor account</Link>
          <Link to={ROUTES.login} className="btn-outline-light justify-center">Login</Link>
        </div>
      </Reveal>
    </section>
  );
}
