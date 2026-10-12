import { MapPin, Phone, CalendarDays, Mail, Globe } from 'lucide-react';
import { sanitizePrintHtml } from '../../utils/sanitizePrintHtml';

/** Keep rich header text; strip images when clinic logo fills the logo slot. */
export function scrubHeaderHtml(html, logoUrl) {
  let out = sanitizePrintHtml(html);
  if (logoUrl) {
    out = out.replace(/<img\b[^>]*>/gi, '');
  }
  out = out
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
    .replace(/(<br\s*\/?>\s*){2,}/gi, '<br />')
    .trim();
  return out;
}

function hasVisibleHtml(html) {
  if (!html) return false;
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim().length > 0;
}

function ContactLine({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <div className="print-contact-line">
      <Icon className="print-contact-icon" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

function RichBlock({ html, className = '', align = 'left' }) {
  if (!hasVisibleHtml(html)) return null;
  return (
    <div
      className={`print-rich ${align === 'right' ? 'print-rich--right' : ''} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Clinic letterhead for Print Settings live preview and PrintDocument.
 * section: 'header' | 'footer' | 'both'
 */
export default function PrintLetterhead({
  branding = {},
  branch,
  mode = 'document', // 'document' | 'settings-header' | 'settings-footer'
  section = 'both', // 'header' | 'footer' | 'both'
  showPlaceholders = false,
}) {
  const includeHeader = branding.includeHeader !== false;
  const includeFooter = branding.includeFooter !== false;
  const address = branch?.address || branding.address || '';
  const logo = branding.logo || '';
  const headerHtml = scrubHeaderHtml(branding.headerHtml, logo);
  const headerPlain = headerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const nameInHeader =
    Boolean(branding.clinicName) &&
    headerPlain.toLowerCase().includes(String(branding.clinicName).toLowerCase());
  const leftHtml = sanitizePrintHtml(branding.leftContentHtml || '');
  const rightHtml = sanitizePrintHtml(branding.rightContentHtml || '');
  const footerHtml = sanitizePrintHtml(branding.footerHtml || '');
  const isSettings = mode.startsWith('settings');
  const wantHeader = section !== 'footer' && mode !== 'settings-footer';
  const wantFooter =
    section !== 'header' && (mode === 'settings-footer' || mode === 'document' || section === 'footer');
  const showHeaderBlock = wantHeader;
  const showFooterBlock = wantFooter;
  const showMetaRow = hasVisibleHtml(leftHtml) || hasVisibleHtml(rightHtml) || showPlaceholders;

  if (!includeHeader && showHeaderBlock && isSettings) {
    return (
      <p className="text-sm text-ink-faint italic text-center py-8 border-b border-dashed border-line">
        Header hidden — using letterpad paper
      </p>
    );
  }

  return (
    <div className={isSettings ? '' : 'print-letterhead'}>
      {includeHeader && showHeaderBlock && (
        <header className="print-header">
          <div className="print-header-top">
            {showPlaceholders && (
              <div className="print-logo-watermark" aria-hidden>
                <span>Your logo here</span>
              </div>
            )}

            <div className="print-header-brand">
              {logo ? (
                <img src={logo} alt="" className="print-logo" />
              ) : showPlaceholders ? (
                <div className="print-logo-placeholder">Logo</div>
              ) : null}

              <RichBlock html={headerHtml} className="print-header-html" />

              {!nameInHeader && branding.clinicName ? (
                <p
                  className="print-clinic-name"
                  style={{ fontSize: `${branding.headingFontSize || 14}px` }}
                >
                  {branding.clinicName}
                </p>
              ) : null}

              {branding.headerText ? (
                <p className="print-header-tagline">{branding.headerText}</p>
              ) : null}
            </div>

            <div className="print-header-contact">
              <ContactLine icon={MapPin}>
                {address || (showPlaceholders ? 'Clinic address' : '')}
              </ContactLine>
              <ContactLine icon={Phone}>
                {branding.phone
                  ? `Helpline No. ${branding.phone}`
                  : showPlaceholders
                    ? 'Helpline No.'
                    : ''}
              </ContactLine>
              <ContactLine icon={CalendarDays}>
                {branding.appointmentPhone || branding.phone
                  ? `Appointment No. ${branding.appointmentPhone || branding.phone}`
                  : showPlaceholders
                    ? 'Appointment No.'
                    : ''}
              </ContactLine>
              <ContactLine icon={Mail}>
                {branding.email || (showPlaceholders ? 'Email' : '')}
              </ContactLine>
              <ContactLine icon={Globe}>
                {branding.website || (showPlaceholders ? '' : '')}
              </ContactLine>
              {branding.registrationNumber ? (
                <p className="print-contact-meta">Reg. {branding.registrationNumber}</p>
              ) : null}
              {branding.gstNumber ? (
                <p className="print-contact-meta">
                  {branding.taxLabel || 'GST'}-{branding.gstNumber}
                </p>
              ) : null}
            </div>
          </div>

          {showMetaRow && (
            <div className="print-header-meta">
              <div className="print-header-meta-col">
                {hasVisibleHtml(leftHtml) ? (
                  <RichBlock html={leftHtml} />
                ) : showPlaceholders ? (
                  <p className="print-placeholder">Left content</p>
                ) : null}
              </div>
              <div className="print-header-meta-col print-header-meta-col--right">
                {hasVisibleHtml(rightHtml) ? (
                  <RichBlock html={rightHtml} align="right" />
                ) : showPlaceholders ? (
                  <p className="print-placeholder">Right content</p>
                ) : null}
              </div>
            </div>
          )}
        </header>
      )}

      {!includeHeader && mode === 'document' && (
        <div className="print-header-spacer" aria-hidden style={{ minHeight: '0.25in' }} />
      )}

      {mode === 'settings-header' && (
        <p className="text-center text-[#9aa3ad] tracking-[0.35em] text-lg py-8">...</p>
      )}

      {mode === 'settings-footer' && (
        <p className="text-center text-[#9aa3ad] tracking-[0.35em] text-lg py-10">...</p>
      )}

      {includeFooter && showFooterBlock && (mode === 'document' || mode === 'settings-footer') && (
        <footer className={`print-footer ${mode === 'document' ? 'print-footer--doc' : ''}`}>
          <RichBlock html={footerHtml} />
          {branding.footerText ? <p className="print-footer-text">{branding.footerText}</p> : null}
          {branding.terms ? <p className="print-footer-terms">{branding.terms}</p> : null}
          {showPlaceholders && !hasVisibleHtml(footerHtml) && !branding.footerText && !branding.terms ? (
            <p className="print-placeholder">Footer text</p>
          ) : null}
        </footer>
      )}

      {!includeFooter && mode === 'settings-footer' && (
        <p className="text-sm text-ink-faint italic text-center border-t border-dashed border-line pt-3">
          Footer hidden — using letterpad paper
        </p>
      )}
    </div>
  );
}
