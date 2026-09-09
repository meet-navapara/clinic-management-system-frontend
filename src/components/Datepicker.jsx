import { useEffect, useRef, useState } from 'react';
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

const parseDateValue = (value) => {
  if (!value) return null;
  const parsed = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : null;
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
  isDateAllowed,
  onInvalidSelect,
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => parseDateValue(value) || new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const selected = parseDateValue(value);
    if (selected) setViewMonth(selected);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`input-field flex items-center justify-between gap-3 text-left bg-white ${
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

      {open && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[260px] bg-white rounded-lg border border-[#e8e0d4] shadow-xl p-2.5 left-0">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth((prev) => subMonths(prev, 1))}
              className="p-1 rounded-md text-gray-500 hover:bg-[#faf7f2] hover:text-[#a8841f] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-xs font-semibold text-gray-900">{format(viewMonth, 'MMMM yyyy')}</p>
            <button
              type="button"
              onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
              className="p-1 rounded-md text-gray-500 hover:bg-[#faf7f2] hover:text-[#a8841f] transition-colors"
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
                  className={`h-7 w-full rounded-md text-xs font-medium transition-all ${
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
        </div>
      )}
    </div>
  );
}
