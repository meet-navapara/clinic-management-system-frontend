/**
 * Static recreation of the doctor dashboard (today stats + schedule).
 * Decorative marketing preview — not live data.
 */
export default function LandingProductPreview({ compact = false }) {
  return (
    <div
      className={`lp-frame ${compact ? 'lp-frame--compact' : ''}`}
      role="img"
      aria-label="Z Health doctor dashboard with today’s appointments"
    >
      <div className="lp-chrome">
        <span />
        <span />
        <span />
        <p>zhealth · doctor workspace</p>
      </div>
      <div className="lp-app">
        <aside className="lp-side">
          <strong>Z Health</strong>
          {['Dashboard', 'Appointments', 'Patients', 'Schedule', 'Billing', 'Campaigns'].map((item, i) => (
            <span key={item} className={i === 0 ? 'on' : ''}>
              {item}
            </span>
          ))}
        </aside>
        <div className="lp-main">
          <header className="lp-head">
            <div>
              <p className="k">Monday clinic day</p>
              <h3>Good morning, Dr. Sharma</h3>
            </div>
            <div className="lp-actions">
              <span className="ghost">Add patient</span>
              <span className="solid">Schedule</span>
            </div>
          </header>
          <p className="lp-label">Today</p>
          <div className="lp-stats">
            {[
              ['Appointments', '18'],
              ['Pending today', '7'],
              ['Completed', '9'],
              ['Patients', '240'],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="lp-split">
            <div className="lp-card">
              <div className="lp-card-h">
                <span>Today’s schedule</span>
                <em>Open calendar</em>
              </div>
              {[
                ['09:00', 'Ananya Rao', 'Follow-up', 'Completed', true],
                ['09:30', 'Vikram Shah', 'Consult', 'Confirmed', false],
                ['10:00', 'Meera Kulkarni', 'New patient', 'Booked', false],
                ['10:30', 'Rahul Desai', 'Review', 'Booked', false],
              ].map(([time, name, type, status, ok]) => (
                <div className="lp-row" key={time}>
                  <b>{time}</b>
                  <div>
                    <p>{name}</p>
                    <small>{type}</small>
                  </div>
                  <em className={ok ? 'ok' : ''}>{status}</em>
                </div>
              ))}
            </div>
            <div className="lp-card">
              <div className="lp-card-h">
                <span>Upcoming</span>
                <em>From tomorrow</em>
              </div>
              {[
                ['Tue · 09:00', 'Ananya Rao'],
                ['Tue · 11:30', 'Vikram Shah'],
                ['Wed · 10:00', 'Meera Kulkarni'],
              ].map(([when, who]) => (
                <div className="lp-row" key={when}>
                  <b>{when}</b>
                  <div>
                    <p>{who}</p>
                    <small>Consultation</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
