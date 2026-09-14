import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Dropdown from './ui/Dropdown';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const parseDateValue = (value) => {
  if (!value) return null;
  const parsed = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : null;
};

const yearFromBound = (bound, fallback) => {
  if (!bound) return fallback;
  const parsed = parseDateValue(bound);
  return parsed ? parsed.getFullYear() : fallback;
};

export default function Datepicker({
  value = '',
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  placeholder = 'Select a date',
  className = '',
  id,
  isDateAllowed,
  onInvalidSelect,
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => parseDateValue(value) || new Date());
  const [panelPos, setPanelPos] = useState(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const minYear = yearFromBound(min, now - 120);
    const maxYear = yearFromBound(max, now + 10);
    const start = Math.min(minYear, maxYear);
    const end = Math.max(minYear, maxYear);
    const list = [];
    for (let year = end; year >= start; year -= 1) list.push(year);
    return list;
  }, [min, max]);

  useEffect(() => {
    const selected = parseDateValue(value);
    if (selected) setViewMonth(selected);
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;

    const placePanel = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, 280);
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      const estimatedHeight = 320;
      const openUp = rect.bottom + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
      setPanelPos({
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        left,
        width,
      });
    };

    placePanel();

    const handlePointerDown = (event) => {
      const target = event.target;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      if (target.closest?.('[data-dropdown-panel]')) return;
      setOpen(false);
    };

    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('resize', placePanel);
    window.addEventListener('scroll', placePanel, true);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('resize', placePanel);
      window.removeEventListener('scroll', placePanel, true);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const isDateDisabled = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    if (isDateAllowed && !isDateAllowed(dateStr)) return true;
    return false;
  };

  const handleSelect = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (isDateDisabled(date)) {
      onInvalidSelect?.(dateStr);
      return;
    }
    onChange(dateStr);
    setOpen(false);
  };

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const selectedDate = parseDateValue(value);
  const today = new Date();

  const calendar = open && !disabled && panelPos
    ? createPortal(
        <div
          ref={panelRef}
          className="fixed z-[80] bg-white rounded-lg border border-[#e8e0d4] shadow-xl p-2.5"
          style={{
            top: panelPos.top,
            bottom: panelPos.bottom,
            left: panelPos.left,
            width: panelPos.width,
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <button
              type="button"
              onClick={() => setViewMonth((prev) => subMonths(prev, 1))}
              className="p-1 rounded-md text-gray-500 hover:bg-[#faf7f2] hover:text-[#a8841f] transition-colors shrink-0"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Dropdown
              size="sm"
              className="flex-1"
              ariaLabel="Month"
              value={String(viewMonth.getMonth())}
              onChange={(next) => {
                setViewMonth((prev) => new Date(prev.getFullYear(), Number(next), 1));
              }}
              options={MONTHS.map((label, index) => ({ value: String(index), label }))}
            />
            <Dropdown
              size="sm"
              className="w-[5.75rem] shrink-0"
              searchable
              searchPlaceholder="Year"
              ariaLabel="Year"
              value={String(viewMonth.getFullYear())}
              onChange={(next) => {
                setViewMonth((prev) => new Date(Number(next), prev.getMonth(), 1));
              }}
              options={years.map((year) => ({ value: String(year), label: String(year) }))}
            />
            <button
              type="button"
              onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
              className="p-1 rounded-md text-gray-500 hover:bg-[#faf7f2] hover:text-[#a8841f] transition-colors shrink-0"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-[10px] font-semibold text-[#a8841f] py-0.5">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const disabledDay = isDateDisabled(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);
              const isCurrentMonth = isSameMonth(day, viewMonth);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelect(day)}
                  className={`h-8 w-full rounded-md text-xs font-medium transition-all ${
                    isSelected
                      ? 'text-[#1c1814] shadow-md'
                      : disabledDay
                        ? 'text-gray-300 cursor-not-allowed'
                        : isCurrentMonth
                          ? 'text-gray-700 hover:bg-[#faf7f2] hover:text-[#a8841f]'
                          : 'text-gray-300 hover:bg-[#faf7f2]/60'
                  } ${isToday && !isSelected ? 'ring-1 ring-[#d4af37]/50' : ''}`}
                  style={
                    isSelected
                      ? {
                          background:
                            'linear-gradient(135deg, #e8c547 0%, #c9a227 50%, #d4af37 100%)',
                        }
                      : undefined
                  }
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`input-field box-border !h-10 !min-h-10 !py-0 flex items-center justify-between gap-3 text-left bg-white ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#d4af37]/60'
        } ${open ? 'ring-2 ring-[#d4af37] border-transparent' : ''}`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {selectedDate ? format(selectedDate, 'EEE, d MMM yyyy') : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-[#a8841f] shrink-0" />
      </button>

      {required && (
        <input
          tabIndex={-1}
          className="sr-only"
          value={value}
          onChange={() => {}}
          required
        />
      )}

      {calendar}
    </div>
  );
}
