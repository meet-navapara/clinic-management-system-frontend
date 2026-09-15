import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Dropdown from '../components/ui/Dropdown';
import { BRAND_NAME } from '../constants/branding';

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24];
const MAX_IMAGE_BYTES = 450_000;

const defaults = {
  clinicName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  registrationNumber: '',
  gstNumber: '',
  taxLabel: 'GST',
  logo: '',
  headerText: '',
  footerText: '',
  headerHtml: '',
  footerHtml: '',
  terms: '',
  includeHeader: true,
  includeFooter: true,
  showLeftSignature: false,
  showRightSignature: true,
  leftSignatureText: '',
  rightSignatureText: '',
  signatureImage: '',
  signatureLabel: 'Authorized signature',
  paperSize: 'A4',
  pageOrientation: 'portrait',
  marginTopIn: 0.5,
  marginBottomIn: 0.5,
  marginLeftIn: 0.5,
  marginRightIn: 0.5,
  headingFontSize: 14,
  contentFontSize: 12,
  subContentFontSize: 11,
  showPoweredBy: false,
  coloredPrint: true,
  currency: 'INR',
  currencySymbol: '₹',
};

async function fileToDataUrl(file, { maxEdge = 900 } = {}) {
  if (!file) return '';
  if (!file.type?.startsWith('image/')) {
    throw new Error('Please choose an image file (PNG or JPG).');
  }
  const raw = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

  // Resize large images so payloads stay under the API body limit
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Invalid image'));
    el.src = raw;
  });

  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  let quality = 0.85;
  let out = canvas.toDataURL('image/jpeg', quality);
  while (out.length > MAX_IMAGE_BYTES && quality > 0.45) {
    quality -= 0.1;
    out = canvas.toDataURL('image/jpeg', quality);
  }
  if (out.length > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large. Use a smaller logo (under ~400 KB).');
  }
  return out;
}

function NumberField({ label, value, onChange, step = 0.1, min = 0, max = 3 }) {
  return (
    <div>
      <label className="label-field">{label}</label>
      <input
        type="number"
        className="input-field"
        step={step}
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function LivePreview({ form, tab }) {
  const showHeader = form.includeHeader;
  const showFooter = form.includeFooter;
  const heading = `${form.headingFontSize || 14}px`;
  const content = `${form.contentFontSize || 12}px`;
  const sub = `${form.subContentFontSize || 11}px`;

  return (
    <div
      className={`rounded-xl border border-line bg-white p-4 min-h-[280px] ${form.coloredPrint === false ? 'grayscale' : ''}`}
      style={{
        paddingTop: `${(form.marginTopIn || 0.5) * 16}px`,
        paddingBottom: `${(form.marginBottomIn || 0.5) * 16}px`,
        paddingLeft: `${(form.marginLeftIn || 0.5) * 16}px`,
        paddingRight: `${(form.marginRightIn || 0.5) * 16}px`,
        fontSize: content,
      }}
    >
      {tab === 'header' && (
        <div className="border-b border-dashed border-line pb-3 mb-3">
          {showHeader ? (
            <div className="flex gap-3 items-start">
              {form.logo ? (
                <img src={form.logo} alt="" className="h-14 w-auto object-contain max-w-[120px]" />
              ) : (
                <div className="h-14 w-14 rounded bg-canvas border border-line flex items-center justify-center text-[10px] text-ink-faint">
                  Logo
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate" style={{ fontSize: heading }}>
                  {form.clinicName || 'Hospital / Clinic name'}
                </p>
                {form.headerText && (
                  <p className="text-ink-muted whitespace-pre-wrap" style={{ fontSize: sub }}>
                    {form.headerText}
                  </p>
                )}
                <p className="text-ink-muted" style={{ fontSize: sub }}>
                  {form.address || 'Address'}
                </p>
                <p className="text-ink-faint" style={{ fontSize: sub }}>
                  {[form.phone && `Helpline: ${form.phone}`, form.email].filter(Boolean).join(' · ') || 'Contact'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-faint italic text-center py-6">
              Header hidden — using letterpad paper
            </p>
          )}
          <p className="mt-4 text-ink-faint text-center" style={{ fontSize: sub }}>
            Invoice / prescription body appears here…
          </p>
        </div>
      )}

      {tab === 'footer' && (
        <div className="min-h-[220px] flex flex-col justify-end">
          <p className="text-center text-ink-faint mb-auto pt-8" style={{ fontSize: sub }}>
            Document body…
          </p>
          {(form.showLeftSignature || form.showRightSignature) && (
            <div className="flex justify-between gap-4 mt-6 mb-4" style={{ fontSize: sub }}>
              <div className="flex-1">
                {form.showLeftSignature && (
                  <div className="whitespace-pre-wrap">
                    {form.signatureImage && form.leftSignatureText === '' ? (
                      <img src={form.signatureImage} alt="" className="h-10 object-contain mb-1" />
                    ) : null}
                    {form.leftSignatureText || 'Left signature'}
                  </div>
                )}
              </div>
              <div className="flex-1 text-right">
                {form.showRightSignature && (
                  <div className="whitespace-pre-wrap">
                    {form.signatureImage ? (
                      <img src={form.signatureImage} alt="" className="h-10 object-contain mb-1 ml-auto" />
                    ) : null}
                    {form.rightSignatureText || form.signatureLabel || 'Right signature'}
                  </div>
                )}
              </div>
            </div>
          )}
          {showFooter ? (
            <div className="border-t border-dashed border-line pt-2" style={{ fontSize: sub }}>
              {form.footerText || 'Footer text'}
              {form.terms && <p className="mt-1 text-ink-faint whitespace-pre-wrap">{form.terms}</p>}
            </div>
          ) : (
            <p className="text-sm text-ink-faint italic text-center border-t border-dashed border-line pt-3">
              Footer hidden — using letterpad paper
            </p>
          )}
          {form.showPoweredBy && (
            <p className="text-center text-[10px] text-ink-faint mt-2">Powered by {BRAND_NAME}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PrintSettingsPage() {
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState('header');
  const [logoFile, setLogoFile] = useState(null);
  const [sigFile, setSigFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/ops/print/settings')
      .then((res) => setForm({ ...defaults, ...(res.data.settings || {}) }))
      .catch(() => setForm({ ...defaults }));
  }, []);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const paperOptions = useMemo(
    () => [
      { value: 'A4', label: 'A4' },
      { value: 'A5', label: 'A5' },
      { value: 'Letter', label: 'Letter' },
      { value: 'receipt', label: 'Receipt (80mm)' },
    ],
    []
  );

  const uploadLogo = async () => {
    try {
      if (!logoFile) return toast.error('Choose a logo file first.');
      const dataUrl = await fileToDataUrl(logoFile, { maxEdge: 800 });
      set({ logo: dataUrl });
      toast.success('Logo ready — click Save to apply.');
    } catch (err) {
      toast.error(err.message || 'Logo upload failed.');
    }
  };

  const uploadSignature = async () => {
    try {
      if (!sigFile) return toast.error('Choose a signature image first.');
      const dataUrl = await fileToDataUrl(sigFile, { maxEdge: 600 });
      set({ signatureImage: dataUrl });
      toast.success('Signature ready — click Save to apply.');
    } catch (err) {
      toast.error(err.message || 'Signature upload failed.');
    }
  };

  const save = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const res = await api.put('/ops/print/settings', form);
      setForm({ ...defaults, ...(res.data.settings || form) });
      toast.success('Print template saved for this clinic.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="page-container">Loading…</div>;

  return (
    <div className="page-container max-w-6xl">
      <PageHeader
        title="Print settings"
        description="Customize letterhead, logo, margins and signatures for invoices, prescriptions and all clinic prints."
      />

      <form onSubmit={save} className="space-y-4">
        {/* Page layout */}
        <section className="card space-y-4">
          <h2 className="text-sm font-semibold text-ink">All pages — layout & fonts</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <NumberField label="Top margin (in)" value={form.marginTopIn} onChange={(marginTopIn) => set({ marginTopIn })} />
            <NumberField label="Left margin (in)" value={form.marginLeftIn} onChange={(marginLeftIn) => set({ marginLeftIn })} />
            <NumberField label="Bottom margin (in)" value={form.marginBottomIn} onChange={(marginBottomIn) => set({ marginBottomIn })} />
            <NumberField label="Right margin (in)" value={form.marginRightIn} onChange={(marginRightIn) => set({ marginRightIn })} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="label-field">Page size</label>
              <Dropdown
                value={form.paperSize || 'A4'}
                onChange={(paperSize) => set({ paperSize })}
                ariaLabel="Page size"
                options={paperOptions}
              />
            </div>
            <div>
              <label className="label-field">Orientation</label>
              <Dropdown
                value={form.pageOrientation || 'portrait'}
                onChange={(pageOrientation) => set({ pageOrientation })}
                ariaLabel="Orientation"
                options={[
                  { value: 'portrait', label: 'Portrait' },
                  { value: 'landscape', label: 'Landscape' },
                ]}
              />
            </div>
            <div>
              <label className="label-field">Heading font size</label>
              <Dropdown
                value={String(form.headingFontSize ?? 14)}
                onChange={(v) => set({ headingFontSize: Number(v) })}
                ariaLabel="Heading font"
                options={FONT_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
              />
            </div>
            <div>
              <label className="label-field">Content font size</label>
              <Dropdown
                value={String(form.contentFontSize ?? 12)}
                onChange={(v) => set({ contentFontSize: Number(v) })}
                ariaLabel="Content font"
                options={FONT_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
              />
            </div>
            <div>
              <label className="label-field">Sub-content font size</label>
              <Dropdown
                value={String(form.subContentFontSize ?? 11)}
                onChange={(v) => set({ subContentFontSize: Number(v) })}
                ariaLabel="Sub content font"
                options={FONT_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
              />
            </div>
          </div>
        </section>

        {/* Clinic identity + signatures */}
        <section className="card space-y-4">
          <h2 className="text-sm font-semibold text-ink">Clinic identity</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label-field">Hospital / clinic name</label>
              <input className="input-field" value={form.clinicName || ''} onChange={(e) => set({ clinicName: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Phone / helpline</label>
              <input className="input-field" value={form.phone || ''} onChange={(e) => set({ phone: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Email</label>
              <input className="input-field" value={form.email || ''} onChange={(e) => set({ email: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Website</label>
              <input className="input-field" value={form.website || ''} onChange={(e) => set({ website: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Address</label>
              <textarea className="input-field" rows={2} value={form.address || ''} onChange={(e) => set({ address: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Registration number</label>
              <input className="input-field" value={form.registrationNumber || ''} onChange={(e) => set({ registrationNumber: e.target.value })} />
            </div>
            <div>
              <label className="label-field">GST / tax number</label>
              <input className="input-field" value={form.gstNumber || ''} onChange={(e) => set({ gstNumber: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label-field">Hospital logo</label>
            <div className="flex flex-wrap items-center gap-2">
              <input type="file" accept="image/*" className="text-sm" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
              <button type="button" className="btn-secondary" onClick={uploadLogo}>
                Upload logo
              </button>
              {form.logo && (
                <button type="button" className="btn-ghost text-sm" onClick={() => set({ logo: '' })}>
                  Remove logo
                </button>
              )}
            </div>
            {form.logo && <img src={form.logo} alt="Logo preview" className="mt-2 h-16 object-contain" />}
          </div>

          <h2 className="text-sm font-semibold text-ink pt-2">Signatures</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label-field">Doctor left signature</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="E.g. Thanks for reference"
                value={form.leftSignatureText || ''}
                onChange={(e) => set({ leftSignatureText: e.target.value })}
              />
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.showLeftSignature)}
                  onChange={(e) => set({ showLeftSignature: e.target.checked })}
                />
                Show left signature
              </label>
            </div>
            <div>
              <label className="label-field">Doctor right signature</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Clinic name / doctor details"
                value={form.rightSignatureText || ''}
                onChange={(e) => set({ rightSignatureText: e.target.value })}
              />
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.showRightSignature !== false}
                  onChange={(e) => set({ showRightSignature: e.target.checked, showSignature: e.target.checked })}
                />
                Show right signature
              </label>
            </div>
          </div>
          <div>
            <label className="label-field">Upload signature image</label>
            <div className="flex flex-wrap items-center gap-2">
              <input type="file" accept="image/*" className="text-sm" onChange={(e) => setSigFile(e.target.files?.[0] || null)} />
              <button type="button" className="btn-secondary" onClick={uploadSignature}>
                Upload signature
              </button>
              <button type="button" className="btn-ghost text-sm" onClick={() => set({ signatureImage: '' })}>
                Reset
              </button>
            </div>
            {form.signatureImage && <img src={form.signatureImage} alt="Signature" className="mt-2 h-12 object-contain" />}
            <p className="text-xs text-ink-faint mt-2">
              If a signature checkbox is on but text and image are blank, the default label is used. An uploaded image is shown when text is blank.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.showPoweredBy)}
                onChange={(e) => set({ showPoweredBy: e.target.checked })}
              />
              Show &quot;Powered by {BRAND_NAME}&quot;
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.coloredPrint !== false}
                onChange={(e) => set({ coloredPrint: e.target.checked })}
              />
              Colored print
            </label>
          </div>
        </section>

        {/* Header / Footer tabs */}
        <section className="card">
          <div className="flex gap-2 border-b border-line mb-4">
            {['header', 'footer'].map((id) => (
              <button
                key={id}
                type="button"
                className={`tab-chip capitalize ${tab === id ? 'bg-ink text-white' : 'text-ink-muted hover:bg-canvas'}`}
                onClick={() => setTab(id)}
              >
                {id}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {tab === 'header' && (
                <>
                  <div>
                    <p className="label-field mb-2">Include header?</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="includeHeader"
                          checked={form.includeHeader !== false}
                          onChange={() => set({ includeHeader: true })}
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="includeHeader"
                          checked={form.includeHeader === false}
                          onChange={() => set({ includeHeader: false })}
                        />
                        No, I have letterpad
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="label-field">Header text (tagline / branch line)</label>
                    <textarea
                      className="input-field"
                      rows={4}
                      placeholder="Optional line under clinic name"
                      value={form.headerText || ''}
                      onChange={(e) => set({ headerText: e.target.value })}
                      disabled={form.includeHeader === false}
                    />
                  </div>
                </>
              )}

              {tab === 'footer' && (
                <>
                  <div>
                    <p className="label-field mb-2">Include footer?</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="includeFooter"
                          checked={form.includeFooter !== false}
                          onChange={() => set({ includeFooter: true })}
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="includeFooter"
                          checked={form.includeFooter === false}
                          onChange={() => set({ includeFooter: false })}
                        />
                        No, I have letterpad
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="label-field">Footer text</label>
                    <textarea
                      className="input-field"
                      rows={3}
                      value={form.footerText || ''}
                      onChange={(e) => set({ footerText: e.target.value })}
                      disabled={form.includeFooter === false}
                    />
                  </div>
                  <div>
                    <label className="label-field">Terms / notes</label>
                    <textarea
                      className="input-field"
                      rows={3}
                      value={form.terms || ''}
                      onChange={(e) => set({ terms: e.target.value })}
                      disabled={form.includeFooter === false}
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Live preview</p>
                <button type="button" className="btn-ghost text-xs" onClick={() => setTab(tab === 'header' ? 'footer' : 'header')}>
                  Preview {tab === 'header' ? 'footer' : 'header'}
                </button>
              </div>
              <LivePreview form={form} tab={tab} />
            </div>
          </div>
        </section>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
