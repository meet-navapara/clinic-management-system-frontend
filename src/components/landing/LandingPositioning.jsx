import Reveal from '../Reveal';

const POINTS = [
  { title: 'One visit record', text: 'Registration, history, appointment, notes, and invoice stay on the same patient.' },
  { title: 'Floor and desk together', text: 'Calendar bookings and front-desk scheduling stay on the same clinic day.' },
  { title: 'Roles that match the clinic', text: 'Doctors own the practice. Staff see only the permissions you grant.' },
  { title: 'Follow-up inside the system', text: 'Reminders, plus WhatsApp and email campaigns on an approved clinic template.' },
];

export default function LandingPositioning() {
  return (
    <section className="lp-position" aria-label="What Z Health covers">
      <div className="site-container">
        <Reveal>
          <p className="lp-kicker">What you actually run</p>
        </Reveal>
        <ol>
          {POINTS.map((item, i) => (
            <Reveal as="li" key={item.title} delay={i * 50}>
              <span>0{i + 1}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
