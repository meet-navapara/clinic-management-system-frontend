import DOMPurify from 'isomorphic-dompurify';

/** Sanitize clinic print HTML before dangerouslySetInnerHTML (keep fonts/images from the editor). */
export function sanitizePrintHtml(html) {
  return DOMPurify.sanitize(String(html || ''), {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['font'],
    ADD_ATTR: ['face', 'size', 'color', 'style', 'class', 'src', 'alt', 'width', 'height'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}
