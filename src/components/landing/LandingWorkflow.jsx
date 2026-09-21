import Reveal from '../Reveal';

const STEPS = [
  {
    n: '01',
    title: 'Register',
    text: 'Find or add the patient with contacts and history.',
    ui: (
      <div className="lp-mini">
        <p>New patient</p>
        <div><span>Name</span><b>Meera Kulkarni</b></div>
        <div><span>Phone</span><b>+91 ······ 2140</b></div>
        <div><span>History</span><b>Returning</b></div>
      </div>
    ),
  },
  {
    n: '02',
    title: 'Schedule',
    text: 'Book a slot, or check them into the live queue.',
    ui: (
      <div className="lp-mini">
        <p>Day calendar</p>
        <div><span>10:00</span><b>Meera · New</b></div>
        <div><span>10:30</span><b>Rahul · Review</b></div>
        <div><span>Queue</span><b>Token A-08</b></div>
      </div>
    ),
  },
  {
    n: '03',
    title: 'Consult',
    text: 'Notes, consent, and prescription on that visit.',
    ui: (
      <div className="lp-mini">
        <p>Consultation</p>
        <div><span>Notes</span><b>Follow-up plan</b></div>
        <div><span>Consent</span><b>Captured</b></div>
        <div><span>Rx</span><b>Ready to print</b></div>
      </div>
    ),
  },
  {
    n: '04',
    title: 'Collect',
    text: 'Invoice and payment against the clinic day.',
    ui: (
      <div className="lp-mini">
        <p>Invoice</p>
        <div><span>Visit</span><b>Consultation</b></div>
        <div><span>Status</span><b>Paid</b></div>
        <div><span>Branch</span><b>Main</b></div>
      </div>
    ),
  },
  {
    n: '05',
    title: 'Follow up',
    text: 'Reminders, or a WhatsApp and email campaign.',
    ui: (
      <div className="lp-mini">
        <p>Campaign</p>
        <div><span>Channel</span><b>WhatsApp</b></div>
        <div><span>Template</span><b>Clinic approved</b></div>
        <div><span>Also</span><b>Email</b></div>
      </div>
    ),
  },
];

export default function LandingWorkflow() {
  return (
    <section id="how-it-works" className="lp-flow">
      <div className="site-container">
        <Reveal className="lp-section-head">
          <p className="lp-kicker">How a visit moves</p>
          <h2>Five steps. One record.</h2>
          <p>Front desk, doctor, and accounts stay on the same path — not five separate tools.</p>
        </Reveal>
        <div className="lp-flow-track">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 60} className="lp-flow-step">
              <span>{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              {step.ui}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
