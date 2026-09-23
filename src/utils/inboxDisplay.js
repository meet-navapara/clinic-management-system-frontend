/** Present doctor inbox rows as short, scannable facts — not WhatsApp script text. */

const TYPE_META = {
  reminder_sent: { badge: 'WhatsApp', badgeTone: 'ok', fallbackTitle: 'WhatsApp sent' },
  reminder_failed: { badge: 'WhatsApp', badgeTone: 'bad', fallbackTitle: 'WhatsApp failed' },
  appointment_scheduled: { badge: 'Visit', badgeTone: 'neutral', fallbackTitle: 'Appointment booked' },
  appointment_rescheduled: { badge: 'Visit', badgeTone: 'neutral', fallbackTitle: 'Appointment rescheduled' },
  appointment_cancelled: { badge: 'Visit', badgeTone: 'bad', fallbackTitle: 'Appointment cancelled' },
  appointment_completed: { badge: 'Visit', badgeTone: 'ok', fallbackTitle: 'Appointment completed' },
  appointment_no_show: { badge: 'Visit', badgeTone: 'warn', fallbackTitle: 'No-show' },
  upcoming_appointment: { badge: 'Visit', badgeTone: 'neutral', fallbackTitle: 'Upcoming visit' },
  patient_added: { badge: 'Patient', badgeTone: 'neutral', fallbackTitle: 'Patient added' },
  account_approved: { badge: 'Account', badgeTone: 'ok', fallbackTitle: 'Account approved' },
  account_rejected: { badge: 'Account', badgeTone: 'bad', fallbackTitle: 'Account rejected' },
  account_suspended: { badge: 'Account', badgeTone: 'warn', fallbackTitle: 'Account suspended' },
  system: { badge: 'System', badgeTone: 'neutral', fallbackTitle: 'Update' },
};

function looksLikeWhatsAppScript(text) {
  const t = String(text || '');
  return /^hello\s/i.test(t) || /your appointment/i.test(t) || t.length > 90;
}

function parseLegacyWhatsAppBody(body) {
  const text = String(body || '').trim();
  if (!text) return { patientName: '', visit: '', kind: '' };

  const hello = text.match(/^hello\s+([^,]+),/i);
  const patientName = hello?.[1]?.trim() || '';

  let kind = '';
  if (/is confirmed/i.test(text)) kind = 'appointment_confirmation';
  else if (/this is a reminder/i.test(text) || /you have an appointment/i.test(text)) {
    kind = 'appointment_reminder';
  }

  const onAt = text.match(/\bon\s+(.+?)\s+at\s+(\d{1,2}:\d{2})\b/i);
  const confirmedFor = text.match(/\bis confirmed for\s+(.+?)\s+at\s+(\d{1,2}:\d{2})\b/i);
  const match = onAt || confirmedFor;
  const visit = match ? `${match[1].trim()} · ${match[2]}` : '';

  return { patientName, visit, kind };
}

export function formatInboxItem(n) {
  const type = n?.type || 'system';
  const meta = TYPE_META[type] || { badge: 'Activity', badgeTone: 'neutral', fallbackTitle: n?.title || 'Notification' };
  const m = n?.metadata || {};

  let title = n?.title || meta.fallbackTitle;
  let patientName = m.patientName || '';
  let visit = [m.dateLabel, m.timeSlot].filter(Boolean).join(' · ');
  let detail = '';
  let badge = meta.badge;

  if (type === 'reminder_sent' || type === 'reminder_failed') {
    const kind = m.kind || '';
    const confirm = kind === 'appointment_confirmation' || /confirmation/i.test(title);
    if (!patientName || !visit) {
      const parsed = parseLegacyWhatsAppBody(n.body);
      if (!patientName) patientName = parsed.patientName;
      if (!visit) visit = parsed.visit;
      if (!kind && parsed.kind) {
        badge = parsed.kind === 'appointment_confirmation' ? 'Confirmation' : 'Reminder';
      }
    }
    if (kind === 'appointment_confirmation' || confirm) badge = 'Confirmation';
    else if (kind === 'appointment_reminder') badge = 'Reminder';
    else if (badge === 'WhatsApp' && /confirmation/i.test(title)) badge = 'Confirmation';
    else if (badge === 'WhatsApp') badge = 'Reminder';

    title = type === 'reminder_sent' ? 'WhatsApp sent' : 'WhatsApp failed';
    if (looksLikeWhatsAppScript(n.body) && !m.patientName) {
      detail = '';
    } else if (n.body && !looksLikeWhatsAppScript(n.body) && type === 'reminder_failed') {
      const leftover = String(n.body)
        .replace(patientName, '')
        .replace(visit, '')
        .replace(/·/g, ' ')
        .trim();
      if (leftover && leftover.length < 80) detail = leftover;
    }
  } else if (looksLikeWhatsAppScript(n.body)) {
    detail = '';
  } else {
    detail = String(n.body || '').trim();
  }

  const lines = [patientName, visit].filter(Boolean);
  const subtitle = lines.join(' · ') || detail;
  const extra = subtitle && detail && detail !== subtitle ? detail : !subtitle ? detail : '';

  return {
    badge,
    badgeTone: type === 'reminder_failed' ? 'bad' : meta.badgeTone,
    title,
    subtitle,
    extra,
  };
}
