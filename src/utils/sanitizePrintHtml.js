import DOMPurify from 'isomorphic-dompurify';

/** Sanitize clinic print HTML before dangerouslySetInnerHTML. */
export function sanitizePrintHtml(html) {
  return DOMPurify.sanitize(String(html || ''), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}
