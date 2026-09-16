import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Dropdown from '../components/ui/Dropdown';
import SimpleRichEditor from '../components/print/SimpleRichEditor';
import PrintLetterhead from '../components/print/PrintLetterhead';
import { BRAND_NAME } from '../constants/branding';
import { ROUTES } from '../constants/routes';

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28];

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
  leftContentHtml: '',
  rightContentHtml: '',
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
  appointmentPhone: '',
};

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

/** Kiwi-style letterhead preview panel */
function LetterheadPreview({ form, tab }) {
  const showLeft = Boolean(form.showLeftSignature);
  const showRight = form.showRightSignature !== false;

  return (
    <div className="relative rounded border border-[#cfd6dd] bg-white min-h-[420px] overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 z-10">
        <span className="inline-block bg-[#8a939c] text-white text-[11px] font-medium px-3 py-1 rounded-bl">
          Preview
        </span>
      </div>
      <div
        className={`p-5 pt-8 ${form.coloredPrint === false ? 'grayscale' : ''}`}
        style={{
          paddingTop: `${Math.max(0.4, form.marginTopIn || 0.5) * 48}px`,
          paddingBottom: `${Math.max(0.4, form.marginBottomIn || 0.5) * 48}px`,
          paddingLeft: `${Math.max(0.4, form.marginLeftIn || 0.5) * 48}px`,
          paddingRight: `${Math.max(0.4, form.marginRightIn || 0.5) * 48}px`,
        }}
      >
        <PrintLetterhead
          branding={form}
          mode={tab === 'footer' ? 'settings-footer' : 'settings-header'}
          showPlaceholders
        />
        {tab === 'footer' && (showLeft || showRight) && (
          <div className="flex justify-between gap-6 mt-8 text-[12px] text-[#555]">
            <div className="flex-1 min-w-0">
              {showLeft && (
                <div>
                  {form.signatureImage ? (
                    <img src={form.signatureImage} alt="" className="h-10 object-contain mb-1" />
                  ) : null}
                  <p className="whitespace-pre-wrap">{form.leftSignatureText || 'Left signature'}</p>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-right">
              {showRight && (
                <div className="inline-block text-right">
                  {form.signatureImage ? (
                    <img src={form.signatureImage} alt="" className="h-10 object-contain mb-1 ml-auto" />
                  ) : null}
                  <p className="whitespace-pre-wrap">
                    {form.rightSignatureText || form.signatureLabel || 'Right signature'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {form.showPoweredBy && tab === 'footer' && (
          <p className="text-center text-[10px] text-ink-faint mt-2">Powered by {BRAND_NAME}</p>
        )}
      </div>
    </div>
  );
}

async function uploadPrintFile(kind, file) {
  const body = new FormData();
  body.append('file', file);
  body.append('kind', kind);
  const res = await api.post('/ops/print/settings/upload', body);
  return res.data;
}

export default function PrintSettingsPage() {
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState('header');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [insertingHeaderImg, setInsertingHeaderImg] = useState(false);

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

  const onLogoSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingLogo(true);
    try {
      const data = await uploadPrintFile('logo', file);
      setForm({ ...defaults, ...(data.settings || {}), logo: data.url });
      toast.success('Logo uploaded and saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Logo upload failed.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const insertImageIntoHeader = async (file) => {
    setInsertingHeaderImg(true);
    try {
      const data = await uploadPrintFile('logo', file);
      setForm((prev) => ({ ...defaults, ...(prev || {}), ...(data.settings || {}), logo: data.url || prev?.logo }));
      toast.success('Clinic logo updated (shown in letterhead).');
      // Return empty so the editor does not embed a duplicate <img> (logo slot handles it).
      return '';
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Image upload failed.');
      return '';
    } finally {
      setInsertingHeaderImg(false);
    }
  };

  const onSignatureSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingSig(true);
    try {
      const data = await uploadPrintFile('signature', file);
      setForm({ ...defaults, ...(data.settings || {}), signatureImage: data.url });
      toast.success('Signature uploaded and saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Signature upload failed.');
    } finally {
      setUploadingSig(false);
    }
  };

  const clearLogo = async () => {
    set({ logo: '' });
    try {
      await api.put('/ops/print/settings', { logo: '' });
      toast.success('Logo removed.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove logo.');
    }
  };

  const clearSignature = async () => {
    set({ signatureImage: '' });
    try {
      await api.put('/ops/print/settings', { signatureImage: '' });
      toast.success('Signature removed.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove signature.');
    }
  };

  const save = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const { logo, signatureImage, ...rest } = form;
      const payload = {
        ...rest,
        logo: logo || '',
        signatureImage: signatureImage || '',
      };
      const res = await api.put('/ops/print/settings', payload);
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
        actions={
          <Link to={ROUTES.printPreview} className="btn-secondary" target="_blank" rel="noreferrer">
            Open print preview
          </Link>
        }
      />

      <form onSubmit={save} className="space-y-4">
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
              <Dropdown value={form.paperSize || 'A4'} onChange={(paperSize) => set({ paperSize })} ariaLabel="Page size" options={paperOptions} />
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

        <section className="card space-y-4">
          <h2 className="text-sm font-semibold text-ink">Clinic identity</h2>
          <p className="text-xs text-ink-faint -mt-2">Used in the letterhead preview contact block (right side).</p>
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
              <label className="label-field">Appointment phone</label>
              <input
                className="input-field"
                placeholder="Optional — defaults to helpline"
                value={form.appointmentPhone || ''}
                onChange={(e) => set({ appointmentPhone: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">Email</label>
              <input className="input-field" value={form.email || ''} onChange={(e) => set({ email: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Address</label>
              <textarea className="input-field" rows={2} value={form.address || ''} onChange={(e) => set({ address: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Website</label>
              <input className="input-field" value={form.website || ''} onChange={(e) => set({ website: e.target.value })} />
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

          <h2 className="text-sm font-semibold text-ink pt-2">Signatures</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label-field">Doctor left signature label</label>
              <textarea
                className="input-field"
                rows={2}
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
                Show left signature on prints
              </label>
            </div>
            <div>
              <label className="label-field">Doctor right signature label</label>
              <textarea
                className="input-field"
                rows={2}
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
                Show right signature on prints
              </label>
            </div>
          </div>
          <div>
            <label className="label-field">Upload signature image</label>
            <div className="flex flex-wrap items-center gap-2">
              <label className={`btn-secondary cursor-pointer ${uploadingSig ? 'opacity-60 pointer-events-none' : ''}`}>
                {uploadingSig ? 'Uploading…' : 'Upload signature'}
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" className="sr-only" disabled={uploadingSig} onChange={onSignatureSelected} />
              </label>
              {form.signatureImage && (
                <button type="button" className="btn-ghost text-sm" onClick={clearSignature}>
                  Reset
                </button>
              )}
            </div>
            {form.signatureImage && <img src={form.signatureImage} alt="Signature" className="mt-2 h-12 object-contain" />}
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(form.showPoweredBy)} onChange={(e) => set({ showPoweredBy: e.target.checked })} />
              Show &quot;Powered by {BRAND_NAME}&quot;
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.coloredPrint !== false} onChange={(e) => set({ coloredPrint: e.target.checked })} />
              Colored print
            </label>
          </div>
        </section>

        {/* Kiwi-style Header / Footer template editor */}
        <section className="card !p-0 overflow-hidden">
          <div className="flex items-center gap-6 px-4 border-b border-line">
            {['header', 'footer'].map((id) => (
              <button
                key={id}
                type="button"
                className={`relative py-3 text-sm font-medium capitalize ${
                  tab === id ? 'text-[#2f6fed]' : 'text-ink-muted hover:text-ink'
                }`}
                onClick={() => setTab(id)}
              >
                {id}
                {tab === id && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#2f6fed]" />}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-0 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-line">
            <div className="p-4 space-y-4 bg-white">
              {tab === 'header' && (
                <>
                  <div>
                    <p className="text-sm font-medium text-ink mb-2">Include Header?</p>
                    <div className="flex flex-wrap gap-5 text-sm text-ink">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="includeHeader"
                          className="accent-[#2f6fed]"
                          checked={form.includeHeader !== false}
                          onChange={() => set({ includeHeader: true })}
                        />
                        Yes.
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="includeHeader"
                          className="accent-[#2f6fed]"
                          checked={form.includeHeader === false}
                          onChange={() => set({ includeHeader: false })}
                        />
                        No, I have Letterpad.
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium text-ink">Header</p>
                      <label className={`text-xs text-[#2f6fed] cursor-pointer ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingLogo ? 'Uploading logo…' : form.logo ? 'Change clinic logo' : 'Upload clinic logo'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                          className="sr-only"
                          disabled={uploadingLogo}
                          onChange={onLogoSelected}
                        />
                      </label>
                    </div>
                    <SimpleRichEditor
                      value={form.headerHtml || ''}
                      onChange={(headerHtml) => set({ headerHtml })}
                      disabled={form.includeHeader === false}
                      minHeight={140}
                      placeholder="Add header content or insert your logo image…"
                      onInsertImage={insertImageIntoHeader}
                      insertingImage={insertingHeaderImg}
                    />
                    {form.logo && (
                      <button type="button" className="btn-ghost text-xs mt-1" onClick={clearLogo}>
                        Remove saved clinic logo
                      </button>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink mb-1.5">Left Content</p>
                    <SimpleRichEditor
                      value={form.leftContentHtml || ''}
                      onChange={(leftContentHtml) => set({ leftContentHtml })}
                      disabled={form.includeHeader === false}
                      minHeight={100}
                      placeholder="Left content here…"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink mb-1.5">Right Content</p>
                    <SimpleRichEditor
                      value={form.rightContentHtml || ''}
                      onChange={(rightContentHtml) => set({ rightContentHtml })}
                      disabled={form.includeHeader === false}
                      minHeight={100}
                      placeholder="Right content here…"
                    />
                  </div>
                </>
              )}

              {tab === 'footer' && (
                <>
                  <div>
                    <p className="text-sm font-medium text-ink mb-2">Include Footer?</p>
                    <div className="flex flex-wrap gap-5 text-sm text-ink">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="includeFooter"
                          className="accent-[#2f6fed]"
                          checked={form.includeFooter !== false}
                          onChange={() => set({ includeFooter: true })}
                        />
                        Yes.
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="includeFooter"
                          className="accent-[#2f6fed]"
                          checked={form.includeFooter === false}
                          onChange={() => set({ includeFooter: false })}
                        />
                        No, I have Letterpad.
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink mb-1.5">Footer</p>
                    <SimpleRichEditor
                      value={form.footerHtml || ''}
                      onChange={(footerHtml) => set({ footerHtml })}
                      disabled={form.includeFooter === false}
                      minHeight={120}
                      placeholder="Footer content…"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink mb-1.5">Left Content</p>
                    <SimpleRichEditor
                      value={form.leftContentHtml || ''}
                      onChange={(leftContentHtml) => set({ leftContentHtml })}
                      disabled={form.includeFooter === false}
                      minHeight={100}
                      placeholder="Left content here…"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink mb-1.5">Right Content</p>
                    <SimpleRichEditor
                      value={form.rightContentHtml || ''}
                      onChange={(rightContentHtml) => set({ rightContentHtml })}
                      disabled={form.includeFooter === false}
                      minHeight={100}
                      placeholder="Right content here…"
                    />
                  </div>

                  <div>
                    <label className="label-field">Terms / notes</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      value={form.terms || ''}
                      onChange={(e) => set({ terms: e.target.value })}
                      disabled={form.includeFooter === false}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-[#f3f5f7]">
              <LetterheadPreview form={form} tab={tab} />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <Link to={ROUTES.printPreview} className="btn-secondary" target="_blank" rel="noreferrer">
            Open print preview
          </Link>
        </div>
      </form>
    </div>
  );
}
