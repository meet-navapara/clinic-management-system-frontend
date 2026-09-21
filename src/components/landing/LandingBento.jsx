import Reveal from '../Reveal';

const TILES = [
  {
    size: 'wide',
    kicker: 'Billing & revenue',
    title: 'Collections sit on the clinic day',
    text: 'Invoices and payments stay with the visit. Revenue can be read by branch when you run more than one location.',
    preview: (
            <div className="lp-bento-ui" aria-hidden>
              <div><span>Sample · collected</span><strong>₹18,400</strong></div>
        <div><span>Outstanding</span><strong>₹2,150</strong></div>
        <div><span>Branch</span><strong>Main</strong></div>
      </div>
    ),
  },
  {
    size: 'tall',
    kicker: 'Campaigns',
    title: 'WhatsApp and email, after approval',
    text: 'Doctors submit a campaign template. Super Admin approves it on MSG91. Sends use that clinic template — not a generic appointment fallback.',
  },
  {
    kicker: 'Branches & staff',
    title: 'More than one location',
    text: 'Scope work by branch and give staff only the permissions they need.',
  },
  {
    kicker: 'Patients & search',
    title: 'Find the record fast',
    text: 'Registration, history, and search across the clinic — then open the visit.',
  },
];

export default function LandingBento() {
  return (
    <section className="lp-bento">
      <div className="site-container">
        <Reveal className="lp-section-head">
          <p className="lp-kicker">Also in the workspace</p>
          <h2>Operations around the visit.</h2>
        </Reveal>
        <div className="lp-bento-grid">
          {TILES.map((tile, i) => (
            <Reveal key={tile.title} delay={i * 40} className={`lp-tile lp-tile--${tile.size || 'base'}`}>
              <p>{tile.kicker}</p>
              <h3>{tile.title}</h3>
              <span>{tile.text}</span>
              {tile.preview}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
