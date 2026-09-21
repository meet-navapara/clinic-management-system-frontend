import { useEffect } from 'react';
import { APP_NAME } from '../constants/branding';
import LandingHero from '../components/landing/LandingHero';
import LandingWorkflow from '../components/landing/LandingWorkflow';
import LandingExperience from '../components/landing/LandingExperience';
import LandingFeatures from '../components/landing/LandingFeatures';
import LandingRoles from '../components/landing/LandingRoles';
import LandingCta from '../components/landing/LandingCta';
import LandingFooter from '../components/landing/LandingFooter';
import { LANDING_IMAGES } from '../constants/landingImages';

const PAGE_TITLE = `${APP_NAME} — Clinic software for patients, queue & billing`;
const PAGE_DESCRIPTION =
  'Z Health is clinic management software for doctors and staff: patients, appointments, live queue, consultation, billing, branches, and WhatsApp or email campaigns in one workspace.';

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

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', PAGE_TITLE);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', PAGE_DESCRIPTION);

    let ogType = document.querySelector('meta[property="og:type"]');
    if (!ogType) {
      ogType = document.createElement('meta');
      ogType.setAttribute('property', 'og:type');
      document.head.appendChild(ogType);
    }
    ogType.setAttribute('content', 'website');

    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', LANDING_IMAGES.hero);

    return () => {
      document.title = previousTitle;
      if (created && meta.parentNode) meta.parentNode.removeChild(meta);
      else if (previousDescription != null) meta.setAttribute('content', previousDescription);
    };
  }, []);

  return (
    <div className="w-full flex-1 overflow-x-hidden bg-[#FFFEFE]">
      <LandingHero />
      <LandingWorkflow />
      <LandingExperience />
      <LandingFeatures />
      <LandingRoles />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
