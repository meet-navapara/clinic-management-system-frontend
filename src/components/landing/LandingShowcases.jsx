import Reveal from '../Reveal';
import { LANDING_IMAGES } from '../../constants/landingImages';

function QueueBoard() {
  return (
    <div className="lp-board" aria-hidden>
      <header>
        <span>Live queue</span>
        <em>Main branch</em>
      </header>
      <div className="lp-board-now">
        <small>Now</small>
        <strong>A-04</strong>
        <span>In consult</span>
      </div>
      <ul>
        {[['A-05', 'Next'], ['A-06', 'Waiting'], ['A-07', 'Waiting'], ['A-08', 'Checked in']].map(([t, s]) => (
          <li key={t}><b>{t}</b><span>{s}</span></li>
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
        <li><b>Clinical notes</b><span>Visit plan saved on this appointment</span></li>
        <li><b>Consent</b><span>Form captured before the consult</span></li>
        <li><b>Prescription</b><span>Print from clinic print settings</span></li>
        <li><b>Invoice</b><span>Optional, tied to the same visit</span></li>
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
            <p className="lp-kicker">Queue</p>
            <h2>The waiting room stays honest.</h2>
            <p className="lp-copy">
              Check-in creates a token. The doctor sees who is next. A waiting-room display can show the same queue — so the floor and the screen do not disagree.
            </p>
            <ul className="lp-checks">
              <li>Walk-in check-in and scheduled arrivals</li>
              <li>Token status from waiting to in consult</li>
              <li>Display route for the waiting area</li>
            </ul>
          </Reveal>
          <Reveal className="lp-showcase-visual">
            <img src={LANDING_IMAGES.waiting} alt="Clinic waiting area" />
            <QueueBoard />
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
              Open an appointment and the clinical work is already there: notes, consent, prescription, and a printable — without jumping to another system mid-consult.
            </p>
            <ul className="lp-checks">
              <li>Notes and follow-up on the appointment</li>
              <li>Consent forms captured in clinic</li>
              <li>Templates and print settings you already use</li>
            </ul>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
