/** Mirror of backend time-slot helpers for client-side UI. */

export function timeToMinutes(hhmm) {
  const m = String(hhmm || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function minutesToTime(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateTimeSlots({
  dayStart = '09:00',
  dayEnd = '18:00',
  durationMinutes = 30,
  breakStart = '13:00',
  breakEnd = '14:00',
} = {}) {
  const step = Math.max(5, Math.min(240, Number(durationMinutes) || 30));
  const start = timeToMinutes(dayStart);
  const end = timeToMinutes(dayEnd);
  if (start == null || end == null || end <= start) return [];

  const brS = timeToMinutes(breakStart);
  const brE = timeToMinutes(breakEnd);
  const hasBreak = brS != null && brE != null && brE > brS;

  const slots = [];
  for (let t = start; t + step <= end; t += step) {
    const slotEnd = t + step;
    if (hasBreak && t < brE && slotEnd > brS) continue;
    slots.push(minutesToTime(t));
  }
  return slots;
}
