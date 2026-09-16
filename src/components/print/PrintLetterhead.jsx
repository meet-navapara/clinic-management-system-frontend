import { MapPin, Phone, CalendarDays, Mail } from 'lucide-react';
import { sanitizePrintHtml } from '../../utils/sanitizePrintHtml';

/** Keep rich header text; strip images when clinic logo fills the logo slot. */
export function scrubHeaderHtml(html, logoUrl) {
  let out = sanitizePrintHtml(html);
  if (logoUrl) {
    out = out.replace(/<img\b[^>]*>/gi, '');
  }
  out = out.replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '').trim();
  return out;
}

function ContactLine({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-1.5 text-[11px] leading-snug text-[#333]">
      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#c0392b]" aria-hidden />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

/**
 * Kiwi Health–style letterhead used by Print Settings live preview and PrintDocument.
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
  const wantFooter = section !== 'header' && (mode === 'settings-footer' || mode === 'document' || section === 'footer');
  const showHeaderBlock = wantHeader;
  const showFooterBlock = wantFooter;

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
        <header className="print-header border-b border-[#d8dde3] pb-3 mb-4">
          <div className="relative flex gap-4 items-start min-h-[76px]">
            {showPlaceholders && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                <span className="text-[22px] sm:text-[26px] font-semibold tracking-wide text-[#c5ccd4]/40 uppercase">
                  Your logo here
                </span>
              </div>
            )}

            {/* Left: logo + optional rich header */}
            <div className="relative z-[1] flex-1 min-w-0">
              {logo ? (
                <img
                  src={logo}
                  alt=""
                  className="max-h-[72px] w-auto max-w-[220px] object-contain object-left"
                />
              ) : showPlaceholders ? (
                <div className="h-16 w-28 rounded border border-dashed border-[#cfd6dd] bg-[#f7f8fa] flex items-center justify-center text-[10px] text-[#9aa3ad]">
                  Logo
                </div>
              ) : null}

              {headerHtml ? (
                <div
                  className="mt-1 text-sm text-ink [&_img]:max-h-[72px] [&_img]:w-auto [&_img]:object-contain"
                  dangerouslySetInnerHTML={{ __html: headerHtml }}
                />
              ) : null}

              {/* Clinic name once — only when not already in rich header */}
              {!nameInHeader && branding.clinicName ? (
                <p
                  className="mt-1 font-semibold text-ink leading-tight"
                  style={{ fontSize: `${branding.headingFontSize || 14}px` }}
                >
                  {branding.clinicName}
                </p>
              ) : null}

              {branding.headerText ? (
                <p className="text-[11px] text-[#666] whitespace-pre-wrap mt-0.5">{branding.headerText}</p>
              ) : null}
            </div>

            {/* Right: contact block */}
            <div className="relative z-[1] w-[44%] max-w-[260px] shrink-0 space-y-1.5">
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
              {(branding.registrationNumber || branding.gstNumber) && (
                <p className="text-[10px] text-[#888] pt-0.5">
                  {branding.registrationNumber ? `Reg. ${branding.registrationNumber} ` : ''}
                  {branding.gstNumber ? `${branding.taxLabel || 'GST'} ${branding.gstNumber}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Left / Right content row (Kiwi) */}
          {(leftHtml || rightHtml || showPlaceholders) && (
            <div className="flex justify-between gap-6 mt-3 text-[12px] text-[#555]">
              <div className="flex-1 min-w-0">
                {leftHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: leftHtml }} />
                ) : showPlaceholders ? (
                  <p className="text-[#9aa3ad]">Left Content Here.</p>
                ) : null}
              </div>
              <div className="flex-1 min-w-0 text-right">
                {rightHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: rightHtml }} />
                ) : showPlaceholders ? (
                  <p className="text-[#9aa3ad]">Right Content Here.</p>
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
        <>
          <p className="text-center text-[#9aa3ad] tracking-[0.35em] text-lg py-10">...</p>
          {(leftHtml || rightHtml || showPlaceholders) && (
            <div className="flex justify-between gap-6 mb-4 text-[12px] text-[#555]">
              <div className="flex-1 min-w-0">
                {leftHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: leftHtml }} />
                ) : (
                  <p className="text-[#9aa3ad]">Left Content Here.</p>
                )}
              </div>
              <div className="flex-1 min-w-0 text-right">
                {rightHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: rightHtml }} />
                ) : (
                  <p className="text-[#9aa3ad]">Right Content Here.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {includeFooter && showFooterBlock && (mode === 'document' || mode === 'settings-footer') && (
        <footer className={`${mode === 'document' ? 'print-footer mt-8' : ''} pt-3 border-t border-[#d8dde3] text-[11px] text-[#666]`}>
          {footerHtml ? <div className="mb-1" dangerouslySetInnerHTML={{ __html: footerHtml }} /> : null}
          {branding.footerText ? <p className="whitespace-pre-wrap">{branding.footerText}</p> : null}
          {branding.terms ? <p className="mt-1 whitespace-pre-wrap text-[#888]">{branding.terms}</p> : null}
          {showPlaceholders && !footerHtml && !branding.footerText && !branding.terms ? (
            <p className="text-[#9aa3ad]">Footer text</p>
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
