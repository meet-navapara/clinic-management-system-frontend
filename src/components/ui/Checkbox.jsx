export default function Checkbox({
  checked = false,
  onChange,
  name,
  id,
  children,
  disabled = false,
  variant = 'field',
  className = '',
}) {
  const selected = Boolean(checked);
  const box =
    variant === 'chip'
      ? `inline-flex items-center gap-2 min-h-9 px-3 rounded-full text-sm border cursor-pointer transition-colors ${
          selected
            ? 'bg-[#fdfaf0] border-[#c9a227] text-ink shadow-[inset_0_0_0_1px_rgba(201,162,39,0.25)]'
            : 'bg-white border-line text-ink hover:border-[#d4af37]/60'
        }`
      : variant === 'inline'
        ? 'inline-flex items-center gap-2 text-sm text-ink cursor-pointer'
        : `flex w-full items-center gap-2.5 h-10 min-h-10 px-3 rounded-lg text-sm border cursor-pointer transition-colors ${
            selected
              ? 'bg-[#fdfaf0] border-[#c9a227] text-ink'
              : 'bg-white border-line text-ink hover:border-[#d4af37]/60'
          }`;

  return (
    <label className={`${box} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`.trim()}>
      <input
        id={id}
        type="checkbox"
        name={name}
        checked={selected}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 shrink-0 rounded border-[#d9d3c8] accent-[#1c2430]"
      />
      {children != null && <span className="min-w-0 leading-5">{children}</span>}
    </label>
  );
}
