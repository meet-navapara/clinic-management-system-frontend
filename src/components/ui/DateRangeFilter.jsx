import { useEffect, useId, useRef, useState } from 'react';
import { CalendarRange, ChevronDown, RotateCcw } from 'lucide-react';
import Datepicker from '../Datepicker';
import {
  DATE_RANGE_PRESETS,
  formatRangeLabel,
  resolveDateRange,
} from '../../utils/dateRangePresets';

/**
 * Preset + custom date range control.
 * value: { preset, from, to, label? }
 * onChange(nextRange)
 */
export default function DateRangeFilter({
  value,
  onChange,
  className = '',
  align = 'end',
  defaultPreset = 'thisMonth',
  showReset = true,
}) {
  const id = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [draftPreset, setDraftPreset] = useState(value?.preset || defaultPreset);
  const [draftFrom, setDraftFrom] = useState(value?.from || '');
  const [draftTo, setDraftTo] = useState(value?.to || '');

  useEffect(() => {
    setDraftPreset(value?.preset || defaultPreset);
    setDraftFrom(value?.from || '');
    setDraftTo(value?.to || '');
  }, [value?.preset, value?.from, value?.to, defaultPreset]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (rootRef.current && rootRef.current.contains(e.target)) return;
      if (e.target?.closest?.('[data-datepicker-panel="true"]')) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const displayLabel =
    value?.label || formatRangeLabel(value?.from, value?.to, value?.preset) || 'Date range';

  const defaultRange = resolveDateRange(defaultPreset);
  const isDefault =
    value?.preset === defaultPreset &&
    value?.from === defaultRange.from &&
    value?.to === defaultRange.to;

  const applyPreset = (presetId) => {
    if (presetId === 'custom') {
      setDraftPreset('custom');
      const seeded = resolveDateRange('custom', draftFrom || value?.from, draftTo || value?.to);
      setDraftFrom(seeded.from);
      setDraftTo(seeded.to);
      return;
    }
    const next = resolveDateRange(presetId);
    setDraftPreset(next.preset);
    setDraftFrom(next.from);
    setDraftTo(next.to);
    onChange?.(next);
    setOpen(false);
  };

  const applyCustom = () => {
    if (!draftFrom || !draftTo) return;
    const next = resolveDateRange('custom', draftFrom, draftTo);
    setDraftPreset('custom');
    setDraftFrom(next.from);
    setDraftTo(next.to);
    onChange?.(next);
    setOpen(false);
  };

  const handleReset = () => {
    const next = resolveDateRange(defaultPreset);
    setDraftPreset(next.preset);
    setDraftFrom(next.from);
    setDraftTo(next.to);
    onChange?.(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`.trim()}>
      <button
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary w-full justify-between gap-2 !font-medium"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <CalendarRange className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Date range"
          className={`absolute top-full z-40 mt-1.5 w-full min-w-0 rounded-xl border border-line bg-white p-1.5 shadow-panel ${
            align === 'start' ? 'left-0' : 'left-0 right-0'
          }`}
        >
          <div className="space-y-0.5">
            {DATE_RANGE_PRESETS.map((preset) => {
              const active = draftPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs sm:text-sm font-medium transition-colors ${
                    active ? 'bg-[#1c2430] text-white' : 'text-ink hover:bg-[#faf8f3]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {draftPreset === 'custom' && (
            <div className="mt-1.5 space-y-2.5 border-t border-line pt-2.5 px-1 pb-1">
              <div className="grid grid-cols-1 gap-2.5">
                <div className="min-w-0">
                  <label className="label-field mb-1" htmlFor={`${id}-from`}>
                    From
                  </label>
                  <Datepicker
                    id={`${id}-from`}
                    value={draftFrom}
                    onChange={setDraftFrom}
                    max={draftTo || undefined}
                    placeholder="Start date"
                  />
                </div>
                <div className="min-w-0">
                  <label className="label-field mb-1" htmlFor={`${id}-to`}>
                    To
                  </label>
                  <Datepicker
                    id={`${id}-to`}
                    value={draftTo}
                    onChange={setDraftTo}
                    min={draftFrom || undefined}
                    placeholder="End date"
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn-primary w-full justify-center"
                disabled={!draftFrom || !draftTo}
                onClick={applyCustom}
              >
                Apply range
              </button>
            </div>
          )}

          {showReset && (
            <div className="mt-1.5 border-t border-line pt-1.5">
              <button
                type="button"
                onClick={handleReset}
                disabled={isDefault}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-ink-muted hover:bg-[#faf8f3] hover:text-ink transition-colors disabled:pointer-events-none disabled:opacity-40"
                aria-label="Reset date filter"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Reset to this month
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
