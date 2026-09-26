import { useEffect, useMemo } from 'react';
import { minutesToTime, timeToMinutes } from '../../utils/timeSlots';

/**
 * Dropdown time picker — only lists times in [min, max] so earlier times
 * cannot be chosen (unlike native <input type="time"> spinners).
 */
export default function TimeSelect({
  id,
  name,
  value,
  onChange,
  min = '00:00',
  max = '23:45',
  stepMinutes = 15,
  className = 'input-field',
  required,
  disabled,
  emptyLabel,
}) {
  const step = Math.max(5, Math.min(60, Number(stepMinutes) || 15));

  const options = useMemo(() => {
    let start = timeToMinutes(min);
    let end = timeToMinutes(max);
    if (start == null) start = 0;
    if (end == null) end = 23 * 60 + 45;
    if (end < start) end = start;

    const list = [];
    for (let t = start; t <= end; t += step) {
      list.push(minutesToTime(t));
    }

    // Keep current value visible if it falls outside the stepped grid but inside range.
    const current = String(value || '').trim();
    if (current && !list.includes(current)) {
      const curMins = timeToMinutes(current);
      if (curMins != null && curMins >= start && curMins <= end) {
        list.push(current);
        list.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
      }
    }

    return list;
  }, [min, max, step, value]);

  // If current value is outside allowed range, snap to first valid option.
  useEffect(() => {
    if (!onChange || !name || !options.length) return;
    if (value && options.includes(value)) return;
    const next = options[0];
    if (next && next !== value) {
      onChange({ target: { name, value: next } });
    }
  }, [options, value, name, onChange]);

  const safeValue = options.includes(value) ? value : options[0] || '';

  return (
    <select
      id={id}
      name={name}
      className={className}
      value={safeValue}
      onChange={onChange}
      required={required}
      disabled={disabled || options.length === 0}
    >
      {emptyLabel && !options.length ? <option value="">{emptyLabel}</option> : null}
      {options.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

/** First time strictly after `time` on the step grid (clamped to 23:45). */
export function nextTimeSlot(time, stepMinutes = 15) {
  const step = Math.max(5, Math.min(60, Number(stepMinutes) || 15));
  const mins = timeToMinutes(time);
  if (mins == null) return '00:15';
  const next = Math.min(23 * 60 + 45, mins + step);
  return minutesToTime(next);
}

/** Last time strictly before `time` on the step grid. */
export function prevTimeSlot(time, stepMinutes = 15) {
  const step = Math.max(5, Math.min(60, Number(stepMinutes) || 15));
  const mins = timeToMinutes(time);
  if (mins == null) return '00:00';
  const prev = Math.max(0, mins - step);
  return minutesToTime(prev);
}
