import { useEffect, useRef } from 'react';

const FONT_FAMILIES = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
  { value: '"Courier New", monospace', label: 'Courier New' },
];

const FONT_SIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32'];

function exec(command, value = null) {
  document.execCommand(command, false, value);
}

/**
 * Lightweight WYSIWYG editor matching Kiwi-style Font Family / Font Sizes / Formats toolbars.
 */
export default function SimpleRichEditor({
  value = '',
  onChange,
  placeholder = '',
  disabled = false,
  minHeight = 120,
  onInsertImage,
  insertingImage = false,
}) {
  const ref = useRef(null);
  const lastHtml = useRef('');

  useEffect(() => {
    if (!ref.current) return;
    if (value !== lastHtml.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value || '';
      lastHtml.current = value || '';
    }
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastHtml.current = html;
    onChange?.(html);
  };

  const run = (command, val) => {
    if (disabled) return;
    ref.current?.focus();
    exec(command, val);
    emit();
  };

  return (
    <div className={`rounded border border-[#cfd6dd] bg-white overflow-hidden ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 border-b border-[#e5e9ee] bg-[#f7f8fa]">
        <select
          className="h-8 text-xs border border-[#cfd6dd] rounded px-2 bg-white text-ink"
          defaultValue=""
          disabled={disabled}
          aria-label="Font family"
          onChange={(e) => {
            if (!e.target.value) return;
            run('fontName', e.target.value);
            e.target.value = '';
          }}
        >
          <option value="" disabled>
            Font Family
          </option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          className="h-8 text-xs border border-[#cfd6dd] rounded px-2 bg-white text-ink"
          defaultValue=""
          disabled={disabled}
          aria-label="Font size"
          onChange={(e) => {
            if (!e.target.value) return;
            run('fontSize', '7');
            const sel = window.getSelection();
            if (sel?.rangeCount) {
              const fonts = ref.current?.querySelectorAll('font[size="7"]');
              fonts?.forEach((node) => {
                node.removeAttribute('size');
                node.style.fontSize = `${e.target.value}px`;
              });
            }
            emit();
            e.target.value = '';
          }}
        >
          <option value="" disabled>
            Font Sizes
          </option>
          {FONT_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          className="h-8 text-xs border border-[#cfd6dd] rounded px-2 bg-white text-ink"
          defaultValue=""
          disabled={disabled}
          aria-label="Formats"
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            if (v === 'bold') run('bold');
            else if (v === 'italic') run('italic');
            else if (v === 'underline') run('underline');
            else if (v === 'ul') run('insertUnorderedList');
            else if (v === 'ol') run('insertOrderedList');
            else if (v === 'left') run('justifyLeft');
            else if (v === 'center') run('justifyCenter');
            else if (v === 'right') run('justifyRight');
            else if (v === 'clear') run('removeFormat');
            e.target.value = '';
          }}
        >
          <option value="" disabled>
            Formats
          </option>
          <option value="bold">Bold</option>
          <option value="italic">Italic</option>
          <option value="underline">Underline</option>
          <option value="ul">Bullet list</option>
          <option value="ol">Numbered list</option>
          <option value="left">Align left</option>
          <option value="center">Align center</option>
          <option value="right">Align right</option>
          <option value="clear">Clear formatting</option>
        </select>
        {onInsertImage && (
          <label className={`h-8 inline-flex items-center px-2 text-xs border border-[#cfd6dd] rounded bg-white cursor-pointer ${insertingImage ? 'opacity-50 pointer-events-none' : ''}`}>
            {insertingImage ? 'Uploading…' : 'Insert image'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="sr-only"
              disabled={disabled || insertingImage}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                const url = await onInsertImage(file);
                if (!url) return;
                ref.current?.focus();
                exec('insertImage', url);
                const imgs = ref.current?.querySelectorAll('img');
                const last = imgs?.[imgs.length - 1];
                if (last) {
                  last.style.maxWidth = '100%';
                  last.style.height = 'auto';
                }
                emit();
              }}
            />
          </label>
        )}
      </div>
      <div className="relative">
        {!value && placeholder ? (
          <p className="pointer-events-none absolute left-3 top-2 text-sm text-[#9aa3ad]">{placeholder}</p>
        ) : null}
        <div
          ref={ref}
          contentEditable={!disabled}
          suppressContentEditableWarning
          className="px-3 py-2 text-sm text-ink outline-none overflow-auto prose-p:my-1"
          style={{ minHeight }}
          onInput={emit}
          onBlur={emit}
        />
      </div>
    </div>
  );
}
