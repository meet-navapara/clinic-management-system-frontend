import Reveal from '../Reveal';
import { LANDING_IMAGES } from '../../constants/landingImages';

const SCENES = [
  {
    eyebrow: 'Front desk',
    title: 'Check-in without the chaos',
    text: 'Reception books visits, finds patients, and moves people into the live queue — the same record the doctor opens minutes later.',
    image: LANDING_IMAGES.frontDesk,
    alt: 'Clinic front desk with staff managing appointments on a computer',
    reverse: false,
  },
  {
    eyebrow: 'Consultation',
    title: 'The visit stays in one place',
    text: 'Notes, consent, prescriptions, and printables live on the appointment — so care and paperwork do not drift apart.',
    image: LANDING_IMAGES.consult,
    alt: 'Calm modern consultation room in a clinic',
    reverse: true,
  },
  {
    eyebrow: 'Waiting room',
    title: 'Queue that patients can see',
    text: 'Tokens and the waiting-room display stay aligned with check-in, so the floor feels ordered even on busy days.',
    image: LANDING_IMAGES.waiting,
    alt: 'Bright clinic waiting area with seating',
    reverse: false,
  },
];

export default function LandingExperience() {
  return (
    <section className="py-14 sm:py-20 md:py-24 bg-[#FFFEFE]" aria-labelledby="landing-experience-heading">
      <div className="site-container">
        <Reveal>
          <p className="section-label mb-2">In the clinic</p>
          <h2 id="landing-experience-heading" className="landing-section-title mb-2">
            Built around real clinic floors
          </h2>
          <p className="text-ink-muted mb-10 sm:mb-14 max-w-2xl text-sm sm:text-base leading-relaxed">
            Z Health mirrors how reception, consulting rooms, and the waiting area already work — then connects them in
            software.
          </p>
        </Reveal>

        <div className="space-y-14 sm:space-y-20 md:space-y-24">
          {SCENES.map((scene, i) => (
            <Reveal key={scene.title} delay={i * 40} className="min-w-0">
              <article
                className={`grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 lg:items-center ${
                  scene.reverse ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div className="landing-photo-frame min-w-0">
                  <img
                    src={scene.image}
                    alt={scene.alt}
                    className="landing-photo"
                    width={1600}
                    height={1067}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="min-w-0 lg:py-2">
                  <p className="section-label mb-2 text-accent-700">{scene.eyebrow}</p>
                  <h3 className="font-serif text-xl sm:text-2xl md:text-[1.75rem] font-bold tracking-tight text-ink leading-tight">
                    {scene.title}
                  </h3>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-ink-muted leading-relaxed max-w-md">
                    {scene.text}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
