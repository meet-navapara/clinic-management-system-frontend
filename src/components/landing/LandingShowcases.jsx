import Reveal from '../Reveal';
import { LANDING_IMAGES } from '../../constants/landingImages';

function DayBoard() {
  return (
    <div className="lp-board" aria-hidden>
      <header>
        <span>Today’s calendar</span>
        <em>Main branch</em>
      </header>
      <div className="lp-board-now">
        <small>Next</small>
        <strong>09:30</strong>
        <span>In progress</span>
      </div>
      <ul>
        {[['10:00', 'Booked'], ['10:30', 'Booked'], ['11:00', 'Confirmed'], ['11:30', 'Open']].map(([t, s]) => (
          <li key={t}>
            <b>{t}</b>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConsultPane() {
  return (
    <div className="lp-board" aria-hidden>
      <header>
        <span>Consultation · 09:00</span>
        <em>Ananya Rao</em>
      </header>
      <ul className="lp-consult-list">
        <li>
          <b>Clinical notes</b>
          <span>Visit plan saved on this appointment</span>
        </li>
        <li>
          <b>Prescription</b>
          <span>Print from clinic print settings</span>
        </li>
        <li>
          <b>Invoice</b>
          <span>Optional, tied to the same visit</span>
        </li>
        <li>
          <b>Follow-up</b>
          <span>Reminders and campaigns when needed</span>
        </li>
      </ul>
    </div>
  );
}

export default function LandingShowcases() {
  return (
    <div id="features">
      <section className="lp-showcase">
        <div className="site-container lp-showcase-grid">
          <Reveal>
            <p className="lp-kicker">Appointments</p>
            <h2>The day calendar stays clear.</h2>
            <p className="lp-copy">
              Book visits, move them when plans change, and see who is next — one schedule for the whole clinic day.
            </p>
            <ul className="lp-checks">
              <li>Day, week, and month views</li>
              <li>Drag to reschedule with available times</li>
              <li>Status from scheduled to completed</li>
            </ul>
          </Reveal>
          <Reveal className="lp-showcase-visual">
            <img src={LANDING_IMAGES.waiting} alt="Clinic waiting area" />
            <DayBoard />
          </Reveal>
        </div>
      </section>

      <section className="lp-showcase lp-showcase--alt">
        <div className="site-container lp-showcase-grid lp-showcase-grid--flip">
          <Reveal className="lp-showcase-visual">
            <img src={LANDING_IMAGES.consult} alt="Consultation room" />
            <ConsultPane />
          </Reveal>
          <Reveal>
            <p className="lp-kicker">Consultation</p>
            <h2>The visit is the workspace.</h2>
            <p className="lp-copy">
              Open an appointment and the clinical work is already there: notes, prescription, and a printable — without jumping to another system mid-consult.
            </p>
            <ul className="lp-checks">
              <li>Notes and follow-up on the appointment</li>
              <li>Templates and print settings you already use</li>
              <li>Invoice when the visit needs billing</li>
            </ul>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
