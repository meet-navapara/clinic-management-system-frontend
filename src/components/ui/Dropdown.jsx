import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

function normalizeOptions(options) {
  return options.map((opt) =>
    typeof opt === 'object'
      ? {
          value: String(opt.value ?? ''),
          label: opt.label,
          description: opt.description || '',
          disabled: Boolean(opt.disabled),
        }
      : { value: String(opt), label: String(opt), description: '', disabled: false }
  );
}

export default function Dropdown({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select',
  disabled = false,
  required = false,
  name,
  id,
  ariaLabel,
  className = '',
  buttonClassName = '',
  size = 'md',
  align = 'left',
  icon: Icon,
  searchable = false,
  searchPlaceholder = 'Type to filter',
  onSearch,
  onOpenChange,
  loading = false,
  emptyMessage = 'No options',
  footerOption = null,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const [panelPos, setPanelPos] = useState(null);
  const [committed, setCommitted] = useState(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const generatedId = useId();
  const listId = `${id || generatedId}-list`;
  const compact = size === 'sm';

  const items = useMemo(() => normalizeOptions(options), [options]);
  const footerItem = useMemo(
    () => (footerOption ? normalizeOptions([footerOption])[0] : null),
    [footerOption]
  );

  const visibleItems = useMemo(() => {
    let list = items;
    if (searchable && !onSearch) {
      const q = query.trim().toLowerCase();
      if (q) {
        list = items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
        );
      }
    }
    return footerItem ? [...list, footerItem] : list;
  }, [items, searchable, onSearch, query, footerItem]);

  const selected =
    items.find((item) => item.value === String(value ?? '')) ||
    (committed && committed.value === String(value ?? '') ? committed : null);

  const setOpenState = (next) => {
    setOpen(next);
    onOpenChange?.(next);
    if (next) {
      setQuery('');
      onSearch?.('');
    }
  };

  useEffect(() => {
    if (!open) return undefined;

    const placePanel = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, compact ? 140 : 200);
      const left =
        align === 'right'
          ? Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)
          : Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      const estimatedHeight = searchable ? 320 : 280;
      const openUp = rect.bottom + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
      setPanelPos({
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        left,
        width,
      });
    };

    placePanel();

    const onPointerDown = (event) => {
      const target = event.target;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpenState(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpenState(false);
      }
    };

    window.addEventListener('resize', placePanel);
    window.addEventListener('scroll', placePanel, true);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', placePanel);
      window.removeEventListener('scroll', placePanel, true);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, align, compact, searchable]);

  useEffect(() => {
    if (!open) return;
    const idx = visibleItems.findIndex((item) => item.value === String(value ?? ''));
    setHighlight(idx >= 0 ? idx : visibleItems.findIndex((item) => !item.disabled));
  }, [open, visibleItems, value]);

  useEffect(() => {
    if (!open || highlight < 0) return;
    const node = listRef.current?.querySelector(`[data-index="${highlight}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open, visibleItems]);

  useEffect(() => {
    if (open && searchable) {
      const id = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [open, searchable]);

  const commit = (item) => {
    if (!item || item.disabled) return;
    setCommitted(item);
    onChange?.(item.value);
    setOpenState(false);
  };

  const moveHighlight = (delta) => {
    if (!visibleItems.length) return;
    let next = highlight;
    for (let i = 0; i < visibleItems.length; i += 1) {
      next = (next + delta + visibleItems.length) % visibleItems.length;
      if (!visibleItems[next].disabled) break;
    }
    setHighlight(next);
  };

  const panel =
    open && !disabled && panelPos
      ? createPortal(
          <div
            ref={panelRef}
            data-dropdown-panel="true"
            className="fixed z-[90] bg-white rounded-lg border border-[#e8e0d4] shadow-panel overflow-hidden"
            style={{
              top: panelPos.top,
              bottom: panelPos.bottom,
              left: panelPos.left,
              width: panelPos.width,
            }}
          >
            {searchable && (
              <div className="p-2 border-b border-line">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
                  <input
                    ref={searchRef}
                    className="input-field !py-0 pl-9"
                    placeholder={searchPlaceholder}
                    value={query}
                    onChange={(event) => {
                      const next = event.target.value;
                      setQuery(next);
                      onSearch?.(next);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        moveHighlight(1);
                      } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        moveHighlight(-1);
                      } else if (event.key === 'Enter') {
                        event.preventDefault();
                        commit(visibleItems[highlight]);
                      }
                    }}
                    autoComplete="off"
                  />
                </div>
              </div>
            )}
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel || placeholder}
              className="max-h-64 overflow-y-auto py-1"
            >
              {loading && visibleItems.length === 0 ? (
                <li className="px-3 py-2 text-sm text-ink-muted">Loading…</li>
              ) : visibleItems.length === 0 ? (
                <li className="px-3 py-2 text-sm text-ink-muted">{emptyMessage}</li>
              ) : (
                visibleItems.map((item, index) => {
                  const isFooter =
                    Boolean(footerItem) &&
                    index === visibleItems.length - 1 &&
                    item.value === footerItem.value;
                  const isSelected = !isFooter && selected?.value === item.value;
                  const isActive = highlight === index;
                  return (
                    <li
                      key={`${item.value}-${index}`}
                      role="none"
                      className={isFooter ? 'border-t border-line mt-1' : undefined}
                    >
                      <button
                        type="button"
                        role="option"
                        data-index={index}
                        aria-selected={isSelected}
                        disabled={item.disabled}
                        onMouseEnter={() => setHighlight(index)}
                        onClick={() => commit(item)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                          item.disabled
                            ? 'text-ink-faint cursor-not-allowed'
                            : isFooter
                              ? `font-semibold text-accent-700 ${isActive ? 'bg-[#faf8f3]' : 'hover:bg-[#faf8f3]'}`
                              : isSelected
                              ? 'bg-ink text-white'
                              : isActive
                                ? 'bg-[#faf8f3] text-ink'
                                : 'text-ink hover:bg-[#faf8f3]'
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{item.label}</span>
                          {item.description ? (
                            <span
                              className={`block text-xs truncate ${
                                isSelected ? 'text-white/70' : 'text-ink-faint'
                              }`}
                            >
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} className={`relative min-w-0 w-full ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => {
          if (disabled) return;
          setOpenState(!open);
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!open) setOpenState(true);
            else moveHighlight(1);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) setOpenState(true);
            else moveHighlight(-1);
          } else if (event.key === 'Enter' || event.key === ' ') {
            if (open) {
              event.preventDefault();
              commit(visibleItems[highlight]);
            }
          }
        }}
        className={`input-field box-border flex items-center gap-2 text-left ${
          compact ? '!py-0 !px-2.5' : '!py-0'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#d4af37]/60'} ${
          open ? 'border-[#c9a227] shadow-[0_0_0_3px_rgba(201,162,39,0.16)]' : ''
        } ${buttonClassName}`}
      >
        {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-700 shrink-0" aria-hidden="true" />}
        <span className={`min-w-0 flex-1 truncate ${selected ? 'text-ink' : 'text-ink-faint'}`}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {required && (
        <input tabIndex={-1} className="sr-only" name={name} value={value ?? ''} onChange={() => {}} required />
      )}

      {panel}
    </div>
  );
}
