import {
  endOfMonth,
  format,
  isValid,
  parse,
  startOfMonth,
  startOfDay,
  endOfDay,
  subDays,
  subMonths,
} from 'date-fns';

export const DATE_RANGE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'last7', label: 'Last 7 days' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'custom', label: 'Custom range' },
];

export function toDateKey(date) {
  if (!date || !isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}

export function parseDateKey(value) {
  if (!value) return null;
  const parsed = parse(String(value), 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : null;
}

export function formatRangeLabel(fromKey, toKey, preset) {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (!from || !to) return DATE_RANGE_PRESETS.find((p) => p.id === preset)?.label || 'Date range';

  if (preset && preset !== 'custom') {
    const presetLabel = DATE_RANGE_PRESETS.find((p) => p.id === preset)?.label;
    if (presetLabel) return presetLabel;
  }

  if (toDateKey(from) === toDateKey(to)) {
    return format(from, 'dd MMM yyyy');
  }
  return `${format(from, 'dd MMM yyyy')} – ${format(to, 'dd MMM yyyy')}`;
}

/** Build inclusive yyyy-MM-dd range for a preset (or custom keys). */
export function resolveDateRange(preset = 'thisMonth', customFrom = '', customTo = '') {
  const now = new Date();
  const todayStart = startOfDay(now);

  if (preset === 'last7') {
    const from = subDays(todayStart, 6);
    const to = todayStart;
    return {
      preset: 'last7',
      from: toDateKey(from),
      to: toDateKey(to),
      label: 'Last 7 days',
    };
  }

  if (preset === 'lastMonth') {
    const prev = subMonths(todayStart, 1);
    const from = startOfMonth(prev);
    const to = endOfMonth(prev);
    return {
      preset: 'lastMonth',
      from: toDateKey(from),
      to: toDateKey(to),
      label: 'Last month',
    };
  }

  if (preset === 'thisMonth') {
    const from = startOfMonth(todayStart);
    const to = endOfMonth(todayStart);
    return {
      preset: 'thisMonth',
      from: toDateKey(from),
      to: toDateKey(to),
      label: 'This month',
    };
  }

  if (preset === 'custom') {
    let from = parseDateKey(customFrom) || todayStart;
    let to = parseDateKey(customTo) || todayStart;
    if (from > to) {
      const tmp = from;
      from = to;
      to = tmp;
    }
    return {
      preset: 'custom',
      from: toDateKey(from),
      to: toDateKey(to),
      label: formatRangeLabel(toDateKey(from), toDateKey(to), 'custom'),
    };
  }

  // today (default)
  return {
    preset: 'today',
    from: toDateKey(todayStart),
    to: toDateKey(todayStart),
    label: 'Today',
  };
}

export function rangeToDayBounds(fromKey, toKey) {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (!from || !to) return null;
  return {
    start: startOfDay(from),
    end: endOfDay(to),
  };
}

export function isSingleDayRange(range) {
  return Boolean(range?.from && range?.to && range.from === range.to);
}
