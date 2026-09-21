import { useEffect } from 'react';
import { APP_NAME } from '../constants/branding';
import { LANDING_IMAGES } from '../constants/landingImages';
import LandingHero from '../components/landing/LandingHero';
import LandingPositioning from '../components/landing/LandingPositioning';
import LandingWorkflow from '../components/landing/LandingWorkflow';
import LandingShowcases from '../components/landing/LandingShowcases';
import LandingBento from '../components/landing/LandingBento';
import LandingRoles from '../components/landing/LandingRoles';
import LandingCta from '../components/landing/LandingCta';
import LandingFooter from '../components/landing/LandingFooter';

const PAGE_TITLE = `${APP_NAME} — Clinic software for the full patient visit`;
const PAGE_DESCRIPTION =
  'Z Health is clinic software for doctors and staff: patients, appointments, live queue, consultation, billing, branches, and WhatsApp or email campaigns in one workspace.';

export default function Landing() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = PAGE_TITLE;
    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    const previousDescription = meta.getAttribute('content');
    meta.setAttribute('content', PAGE_DESCRIPTION);
    const setOg = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    setOg('og:title', PAGE_TITLE);
    setOg('og:description', PAGE_DESCRIPTION);
    setOg('og:type', 'website');
    setOg('og:image', LANDING_IMAGES.hero);
    return () => {
      document.title = previousTitle;
      if (created && meta.parentNode) meta.parentNode.removeChild(meta);
      else if (previousDescription != null) meta.setAttribute('content', previousDescription);
    };
  }, []);

  return (
    <div className="lp-page">
      <LandingHero />
      <LandingPositioning />
      <LandingWorkflow />
      <LandingShowcases />
      <LandingBento />
      <LandingRoles />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
