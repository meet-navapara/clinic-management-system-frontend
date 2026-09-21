import Reveal from '../Reveal';

const FLOW = [
  {
    step: '01',
    title: 'Register',
    text: 'Add or find the patient with history, contacts, and prior visits.',
  },
  {
    step: '02',
    title: 'Schedule',
    text: 'Book on the day calendar or check the patient into the live queue.',
  },
  {
    step: '03',
    title: 'Consult',
    text: 'Clinical notes, consent, prescription, and templates in one visit.',
  },
  {
    step: '04',
    title: 'Collect',
    text: 'Raise invoices and record payments against the clinic day.',
  },
  {
    step: '05',
    title: 'Follow up',
    text: 'Reminders plus WhatsApp and email campaigns from the same system.',
  },
];

export default function LandingWorkflow() {
  return (
    <section id="how-it-works" className="py-14 sm:py-20 md:py-24 bg-[#FFFEFE] scroll-mt-16">
      <div className="site-container">
        <Reveal>
          <p className="section-label mb-2">How it works</p>
          <h2 className="landing-section-title mb-2">From registration to follow-up</h2>
          <p className="text-ink-muted mb-9 sm:mb-12 max-w-2xl text-sm sm:text-base leading-relaxed">
            Front desk, doctor, and accounts stay on one path for every visit — not scattered across tools.
          </p>
        </Reveal>

        <ol className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-0 list-none p-0 m-0 border-t border-line">
          {FLOW.map((item, i) => (
            <Reveal
              as="li"
              key={item.step}
              delay={i * 70}
              className="border-b lg:border-b-0 lg:border-r border-line last:border-r-0 py-6 lg:pr-5 lg:pl-5 first:lg:pl-0 min-w-0"
            >
              <p className="text-[11px] font-semibold tracking-wider text-accent-700">{item.step}</p>
              <h3 className="mt-2 text-base sm:text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">{item.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
