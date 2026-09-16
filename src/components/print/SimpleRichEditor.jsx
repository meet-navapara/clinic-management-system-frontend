import { useCallback, useEffect, useRef, useState } from 'react';

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

function normalizeFamily(raw = '') {
  return String(raw)
    .split(',')[0]
    .replace(/['"]/g, '')
    .trim()
    .toLowerCase();
}

function matchFamilyOption(computed) {
  const key = normalizeFamily(computed);
  if (!key) return '';
  const hit = FONT_FAMILIES.find((f) => normalizeFamily(f.value) === key || normalizeFamily(f.label) === key);
  return hit?.value || '';
}

function nearestPxSize(px) {
  const n = Math.round(Number.parseFloat(px));
  if (!Number.isFinite(n)) return '';
  const exact = FONT_SIZES.find((s) => Number(s) === n);
  if (exact) return exact;
  // Snap to nearest listed size so the select can show a value
  let best = FONT_SIZES[0];
  let bestDiff = Math.abs(Number(best) - n);
  for (const s of FONT_SIZES) {
    const d = Math.abs(Number(s) - n);
    if (d < bestDiff) {
      best = s;
      bestDiff = d;
    }
  }
  return best;
}

function selectionStyleRoot(editorEl) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !editorEl) return null;
  let node = sel.anchorNode;
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  if (!node || !editorEl.contains(node)) return null;
  return node;
}

/**
 * Lightweight WYSIWYG editor matching Kiwi-style Font Family / Font Sizes / Formats toolbars.
 * Dropdowns reflect the latest applied / caret styles.
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
  const [fontFamily, setFontFamily] = useState('');
  const [fontSize, setFontSize] = useState('');
  const [format, setFormat] = useState('');

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

  const syncToolbarFromSelection = useCallback(() => {
    const node = selectionStyleRoot(ref.current);
    if (!node) return;
    const style = window.getComputedStyle(node);
    setFontFamily(matchFamilyOption(style.fontFamily));
    setFontSize(nearestPxSize(style.fontSize));

    if (document.queryCommandState('bold')) setFormat('bold');
    else if (document.queryCommandState('italic')) setFormat('italic');
    else if (document.queryCommandState('underline')) setFormat('underline');
    else if (document.queryCommandState('insertUnorderedList')) setFormat('ul');
    else if (document.queryCommandState('insertOrderedList')) setFormat('ol');
    else if (document.queryCommandState('justifyCenter')) setFormat('center');
    else if (document.queryCommandState('justifyRight')) setFormat('right');
    else if (document.queryCommandState('justifyLeft')) setFormat('left');
    else setFormat('');
  }, []);

  useEffect(() => {
    const onSel = () => {
      if (!ref.current) return;
      const sel = window.getSelection();
      if (!sel?.anchorNode || !ref.current.contains(sel.anchorNode)) return;
      syncToolbarFromSelection();
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, [syncToolbarFromSelection]);

  const run = (command, val) => {
    if (disabled) return;
    ref.current?.focus();
    exec(command, val);
    emit();
    syncToolbarFromSelection();
  };

  const applyFontSize = (px) => {
    if (disabled || !px) return;
    ref.current?.focus();
    // Mark selection with font size 7, then convert those markers to px styles
    exec('fontSize', '7');
    const fonts = ref.current?.querySelectorAll('font[size="7"]');
    fonts?.forEach((node) => {
      node.removeAttribute('size');
      node.style.fontSize = `${px}px`;
    });
    setFontSize(px);
    emit();
    syncToolbarFromSelection();
  };

  const applyFontFamily = (family) => {
    if (disabled || !family) return;
    setFontFamily(family);
    run('fontName', family);
  };

  const applyFormat = (v) => {
    if (!v || disabled) return;
    if (v === 'bold') run('bold');
    else if (v === 'italic') run('italic');
    else if (v === 'underline') run('underline');
    else if (v === 'ul') run('insertUnorderedList');
    else if (v === 'ol') run('insertOrderedList');
    else if (v === 'left') run('justifyLeft');
    else if (v === 'center') run('justifyCenter');
    else if (v === 'right') run('justifyRight');
    else if (v === 'clear') {
      run('removeFormat');
      setFormat('');
      return;
    }
    setFormat(v);
  };

  return (
    <div className={`rounded border border-[#cfd6dd] bg-white overflow-hidden ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 border-b border-[#e5e9ee] bg-[#f7f8fa]">
        <select
          className="h-8 text-xs border border-[#cfd6dd] rounded px-2 bg-white text-ink min-w-[7.5rem]"
          value={fontFamily}
          disabled={disabled}
          aria-label="Font family"
          onChange={(e) => applyFontFamily(e.target.value)}
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
          className="h-8 text-xs border border-[#cfd6dd] rounded px-2 bg-white text-ink min-w-[5.5rem]"
          value={fontSize}
          disabled={disabled}
          aria-label="Font size"
          onChange={(e) => applyFontSize(e.target.value)}
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
          className="h-8 text-xs border border-[#cfd6dd] rounded px-2 bg-white text-ink min-w-[6.5rem]"
          value={format}
          disabled={disabled}
          aria-label="Formats"
          onChange={(e) => applyFormat(e.target.value)}
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
          <label
            className={`h-8 inline-flex items-center px-2 text-xs border border-[#cfd6dd] rounded bg-white cursor-pointer ${
              insertingImage ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
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
          onMouseUp={syncToolbarFromSelection}
          onKeyUp={syncToolbarFromSelection}
        />
      </div>
    </div>
  );
}
