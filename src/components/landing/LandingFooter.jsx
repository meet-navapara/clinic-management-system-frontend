import { Link } from 'react-router-dom';
import { LOGO_URL, BRAND_NAME, BRAND_TAGLINE } from '../../constants/branding';
import { ROUTES } from '../../constants/routes';

export default function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="site-container">
        <div className="lp-footer-top">
          <div className="lp-footer-brand-block">
            <Link to={ROUTES.home} className="lp-footer-logo" aria-label={BRAND_NAME}>
              <img src={LOGO_URL} alt={BRAND_NAME} width={160} height={40} decoding="async" />
            </Link>
            <p className="lp-footer-tagline">{BRAND_TAGLINE}</p>
            <p className="lp-footer-note">Clinic software for the visit — patients through follow-up.</p>
          </div>
          <div>
            <p>Product</p>
            <a href="#product">Overview</a>
            <a href="#how-it-works">How it works</a>
            <a href="#features">Queue & consult</a>
            <a href="#roles">Roles</a>
          </div>
          <div>
            <p>Access</p>
            <Link to={ROUTES.doctorSignup}>Create doctor account</Link>
            <Link to={ROUTES.login}>Login</Link>
            <Link to={ROUTES.forgotPassword}>Forgot password</Link>
          </div>
        </div>
        <p className="lp-footer-copy">
          © {new Date().getFullYear()} {BRAND_NAME}
        </p>
      </div>
    </footer>
  );
}
