/**
 * Static product UI preview based on the real clinic workspace
 * (sidebar modules, calendar day, queue tokens). Decorative only.
 */
export default function LandingProductPreview({ className = '' }) {
  return (
    <div
      className={`landing-product-preview ${className}`.trim()}
      role="img"
      aria-label="Z Health clinic workspace showing appointments, queue, and patient visit flow"
    >
      <div className="landing-product-chrome">
        <span className="landing-product-dot" />
        <span className="landing-product-dot" />
        <span className="landing-product-dot" />
        <span className="landing-product-url">app.zhealth · clinic workspace</span>
      </div>

      <div className="landing-product-body">
        <aside className="landing-product-side" aria-hidden>
          <p className="landing-product-side-brand">Z Health</p>
          <nav className="landing-product-nav">
            {[
              ['Dashboard', true],
              ['Appointments', false],
              ['Patients', false],
              ['Queue', false],
              ['Billing', false],
              ['Campaigns', false],
            ].map(([label, active]) => (
              <span key={label} className={active ? 'is-active' : undefined}>
                {label}
              </span>
            ))}
          </nav>
        </aside>

        <div className="landing-product-main" aria-hidden>
          <header className="landing-product-top">
            <div>
              <p className="landing-product-kicker">Today</p>
              <p className="landing-product-heading">Clinic day</p>
            </div>
            <div className="landing-product-pills">
              <span>Main branch</span>
              <span className="is-accent">12 waiting</span>
            </div>
          </header>

          <div className="landing-product-grid">
            <div className="landing-product-panel">
              <p className="landing-product-panel-title">Appointments</p>
              <ul>
                {[
                  ['09:00', 'Ananya R.', 'Follow-up', 'Arrived'],
                  ['09:30', 'Vikram S.', 'Consult', 'Waiting'],
                  ['10:00', 'Meera K.', 'New patient', 'Booked'],
                  ['10:30', 'Rahul D.', 'Review', 'Booked'],
                ].map(([time, name, type, status]) => (
                  <li key={time}>
                    <span className="t">{time}</span>
                    <span className="n">{name}</span>
                    <span className="y">{type}</span>
                    <span className={`s ${status === 'Arrived' ? 'ok' : ''}`}>{status}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="landing-product-panel landing-product-queue">
              <p className="landing-product-panel-title">Live queue</p>
              <div className="landing-product-tokens">
                {[
                  ['A-04', 'In consult'],
                  ['A-05', 'Next'],
                  ['A-06', 'Waiting'],
                  ['A-07', 'Waiting'],
                ].map(([token, state]) => (
                  <div key={token} className={state === 'In consult' ? 'is-current' : undefined}>
                    <strong>{token}</strong>
                    <span>{state}</span>
                  </div>
                ))}
              </div>
              <p className="landing-product-note">Waiting-room display stays in sync with check-in.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
