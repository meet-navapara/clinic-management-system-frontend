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

function parseLocalDateKey(dateStr) {
  const m = String(dateStr || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

/** True when the slot start is at or before now. */
export function isSlotInPast(dateStr, timeSlot, now = new Date()) {
  const day = parseLocalDateKey(dateStr);
  const mins = timeToMinutes(timeSlot);
  if (!day || mins == null) return true;
  const slotAt = new Date(day);
  slotAt.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return slotAt.getTime() <= now.getTime();
}

/** Hide times that have already passed (today or earlier days). */
export function filterFutureSlots(slots, dateStr, now = new Date()) {
  if (!dateStr) return slots || [];
  return (slots || []).filter((slot) => !isSlotInPast(dateStr, slot, now));
}
