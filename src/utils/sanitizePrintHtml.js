import DOMPurify from 'isomorphic-dompurify';

/** Drop layout-breaking CSS from editor paste (floats, absolute, huge sizes). */
function scrubInlineStyles(html) {
  return String(html || '').replace(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi, (_m, quote, style) => {
    const kept = String(style)
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => {
        const prop = part.split(':')[0]?.trim().toLowerCase();
        if (!prop) return false;
        if (
          /^(position|float|clear|top|left|right|bottom|z-index|display|width|height|max-width|max-height|min-width|min-height|margin|padding|transform|overflow)$/.test(
            prop
          )
        ) {
          return false;
        }
        return /^(color|background-color|font|text-align|text-decoration|font-weight|font-style|font-size|line-height)$/.test(
          prop
        );
      });
    if (!kept.length) return '';
    return ` style=${quote}${kept.join('; ')}${quote}`;
  });
}

/** Sanitize clinic print HTML before dangerouslySetInnerHTML (keep fonts/images from the editor). */
export function sanitizePrintHtml(html) {
  const cleaned = scrubInlineStyles(String(html || ''));
  return DOMPurify.sanitize(cleaned, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['font'],
    ADD_ATTR: ['face', 'size', 'color', 'style', 'class', 'src', 'alt', 'width', 'height'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}
