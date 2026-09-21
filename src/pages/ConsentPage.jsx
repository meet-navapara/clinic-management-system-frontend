import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { Download } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Dropdown from '../components/ui/Dropdown';
import PatientPicker from '../components/PatientPicker';
import Pagination from '../components/ui/Pagination';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import { useBranch } from '../context/BranchContext';
import RequiredMark from '../components/ui/RequiredMark';
import SignaturePad from '../components/SignaturePad';
import { SkeletonCards, SkeletonRows } from '../components/ui/Skeleton';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { PAGE_SIZE } from '../constants/pagination';
import { downloadConsentPdf } from '../utils/downloadConsent';

const EMPTY_ASSIGN = { consentTemplateId: '', patientId: '' };
const EMPTY_FORM = { name: '', category: 'general', body: '' };

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
];

export default function ConsentPage() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [templates, setTemplates] = useState([]);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [sign, setSign] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [assign, setAssign] = useState(EMPTY_ASSIGN);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const signatureRef = useRef(null);
  const prefillHandled = useRef(false);

  const canCapture = can(user, P.CONSENT_CAPTURE);
  const canManageTemplates = can(user, P.CONSENT_TEMPLATES);
  const canPrint = canCapture || canManageTemplates;

  const loadTemplates = () =>
    api
      .get('/consent/templates', { params: { active: 'all' } })
      .then((res) => setTemplates(res.data.templates || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load consent templates.'));

  const loadRecords = (p = 1) => {
    const params = { page: p, limit: PAGE_SIZE };
    if (statusFilter !== 'all') params.status = statusFilter;
    return api
      .get('/consent/records', { params })
      .then((res) => {
        setRecords(res.data.records || []);
        setPages(res.data.pages || 1);
        setPage(res.data.page || p);
        setTotal(res.data.total || 0);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load consent records.'));
  };

  const load = (showLoader = false, recordPage = 1) => {
    if (showLoader) setLoading(true);
    Promise.all([loadTemplates(), loadRecords(recordPage)]).finally(() => setLoading(false));
  };

  useEffect(() => {
    load(true, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, statusFilter]);

  // Prefill assign from Add Patient & Consent (?patientId=)
  useEffect(() => {
    if (prefillHandled.current || loading || !canCapture) return;
    const patientId = searchParams.get('patientId');
    if (!patientId) return;
    prefillHandled.current = true;
    setAssign({ consentTemplateId: '', patientId });
    setAssignOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('patientId');
    setSearchParams(next, { replace: true });
  }, [loading, canCapture, searchParams, setSearchParams]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (t) => {
    setEditingId(t._id);
    setForm({ name: t.name || '', category: t.category || 'general', body: t.body || '' });
    setOpen(true);
  };

  const openAssign = () => {
    setAssign(EMPTY_ASSIGN);
    setAssignOpen(true);
  };

  const saveTpl = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.body.trim()) {
      toast.error('Name and consent text are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        body: form.body.trim(),
      };
      if (editingId) {
        await api.patch(`/consent/templates/${editingId}`, payload);
        toast.success('Template updated.');
      } else {
        await api.post('/consent/templates', payload);
        toast.success('Template created.');
      }
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      load(false, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t) => {
    try {
      await api.patch(`/consent/templates/${t._id}`, { isActive: !t.isActive });
      toast.success(t.isActive ? 'Template deactivated.' : 'Template activated.');
      loadTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    }
  };

  const doAssign = async (e) => {
    e.preventDefault();
    if (!assign.consentTemplateId || !assign.patientId) {
      toast.error('Select a template and patient.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/consent/records', assign);
      toast.success('Consent assigned.');
      setAssignOpen(false);
      setAssign(EMPTY_ASSIGN);
      setStatusFilter('pending');
      load(false, 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed.');
    } finally {
      setSaving(false);
    }
  };

  const submitSign = async (status) => {
    const signatureDataUrl = signatureRef.current?.toDataURL?.() || '';
    if (status === 'accepted' && signatureRef.current?.isEmpty?.()) {
      toast.error('Please sign in the box first.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/consent/records/${sign._id}/sign`, {
        status,
        signatureDataUrl,
        signerName: sign.patientId?.name,
      });
      toast.success(status === 'accepted' ? 'Consent accepted.' : 'Consent rejected.');
      setSign(null);
      load(false, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (r) => {
    if (!r?._id || downloadingId) return;
    setDownloadingId(r._id);
    try {
      await downloadConsentPdf(r._id);
      toast.success('Consent downloaded.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  const activeTemplates = templates.filter((t) => t.isActive !== false);

  return (
    <div className="page-container relative">
      <LoadingOverlay show={saving} message="Saving…" />
      <PageHeader
        title="Consent forms"
        description="Create clinic consent templates, assign them to patients, capture signatures, and print."
        actions={
          <div className="flex flex-wrap gap-2">
            {canCapture && (
              <button type="button" className="btn-secondary" onClick={openAssign} disabled={!activeTemplates.length}>
                Assign to patient
              </button>
            )}
            {canManageTemplates && (
              <button type="button" className="btn-primary" onClick={openCreate}>
                New template
              </button>
            )}
          </div>
        }
      />

      {loading ? (
        <>
          <h3 className="text-sm font-semibold mb-2">Templates</h3>
          <SkeletonCards count={4} className="!grid-cols-1 sm:!grid-cols-2 mb-6" />
          <h3 className="text-sm font-semibold mb-2">Records</h3>
          <SkeletonRows count={6} />
        </>
      ) : (
        <>
          <h3 className="text-sm font-semibold mb-2">Templates</h3>
          {!templates.length ? (
            <EmptyState
              title="No templates yet"
              description="Create a consent form template before assigning it to patients."
              action={
                canManageTemplates ? (
                  <button type="button" className="btn-primary" onClick={openCreate}>
                    New template
                  </button>
                ) : null
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {templates.map((t) => (
                <div key={t._id} className={`card ${t.isActive === false ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{t.name}</p>
                      <p className="text-xs text-ink-faint capitalize">
                        v{t.version} · {t.category}
                      </p>
                    </div>
                    <Badge value={t.isActive === false ? 'inactive' : 'active'} />
                  </div>
                  {t.body ? (
                    <p className="text-xs text-ink-muted mt-2 line-clamp-3 whitespace-pre-wrap">{t.body}</p>
                  ) : null}
                  {canManageTemplates && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(t)}>
                        Edit
                      </button>
                      <button type="button" className="btn-ghost btn-sm" onClick={() => toggleActive(t)}>
                        {t.isActive === false ? 'Activate' : 'Deactivate'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold">Records</h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(s.id)}
                  className={`tab-chip ${
                    statusFilter === s.id ? 'bg-ink text-white' : 'bg-white text-ink-muted ring-1 ring-line'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {!records.length ? (
            <EmptyState
              title={statusFilter === 'all' ? 'No consent records' : `No ${statusFilter} consents`}
              description={
                !activeTemplates.length
                  ? 'Add an active template first, then assign it to a patient.'
                  : 'Assign a template to a patient to start capturing a signature.'
              }
              action={
                canCapture && activeTemplates.length ? (
                  <button type="button" className="btn-primary" onClick={openAssign}>
                    Assign to patient
                  </button>
                ) : null
              }
            />
          ) : (
            <>
              <p className="text-xs text-ink-faint mb-2">
                {total} record{total === 1 ? '' : 's'}
                {pages > 1 ? ` · page ${page} of ${pages}` : ''}
              </p>
              <div className="space-y-2">
                {records.map((r) => {
                  const patientId = r.patientId?._id || r.patientId;
                  const when =
                    r.signedAt && isValid(new Date(r.signedAt))
                      ? format(new Date(r.signedAt), 'dd MMM yyyy, HH:mm')
                      : r.createdAt && isValid(new Date(r.createdAt))
                        ? format(new Date(r.createdAt), 'dd MMM yyyy')
                        : '';
                  return (
                    <div
                      key={r._id}
                      className="card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{r.titleSnapshot}</p>
                        <p className="text-sm text-ink-muted">
                          {patientId ? (
                            <Link
                              to={ROUTES.doctorPatientDetail(patientId)}
                              className="font-medium text-ink hover:underline"
                            >
                              {r.patientId?.name || 'Patient'}
                            </Link>
                          ) : (
                            r.patientId?.name || 'Patient'
                          )}
                          {` · v${r.version}`}
                          {when ? ` · ${when}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge value={r.status} />
                        {r.status === 'pending' && canCapture && (
                          <button type="button" className="btn-primary btn-sm" onClick={() => setSign(r)}>
                            Capture
                          </button>
                        )}
                        {canPrint && (
                          <button
                            type="button"
                            className="btn-ghost btn-sm inline-flex items-center gap-1"
                            disabled={downloadingId === r._id}
                            onClick={() => handleDownload(r)}
                          >
                            <Download className="w-3.5 h-3.5" />
                            {downloadingId === r._id ? 'Saving…' : 'Download'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={loadRecords} />
            </>
          )}
        </>
      )}

      <Modal
        open={open}
        title={editingId ? 'Edit consent template' : 'Consent template'}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
          setForm(EMPTY_FORM);
        }}
        wide
      >
        <form onSubmit={saveTpl} className="space-y-3">
          <div>
            <label className="label-field">
              Name <RequiredMark />
            </label>
            <input
              className="input-field"
              required
              placeholder="e.g. Treatment consent"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">Category</label>
            <Dropdown
              value={form.category}
              onChange={(category) => setForm({ ...form, category })}
              ariaLabel="Category"
              options={['general', 'procedure', 'therapy', 'privacy', 'treatment', 'other']}
            />
          </div>
          <div>
            <label className="label-field">
              Consent text <RequiredMark />
            </label>
            <textarea
              className="input-field"
              rows={8}
              required
              placeholder="Full consent language shown to the patient"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update template' : 'Save'}
          </button>
        </form>
      </Modal>

      <Modal
        open={assignOpen}
        title="Assign consent"
        onClose={() => {
          setAssignOpen(false);
          setAssign(EMPTY_ASSIGN);
        }}
      >
        <form onSubmit={doAssign} className="space-y-3">
          {!activeTemplates.length ? (
            <p className="text-sm text-ink-muted">Create and activate a template before assigning.</p>
          ) : (
            <>
              <div>
                <label className="label-field">
                  Template <RequiredMark />
                </label>
                <Dropdown
                  required
                  value={assign.consentTemplateId}
                  onChange={(consentTemplateId) => setAssign({ ...assign, consentTemplateId })}
                  placeholder="Select template"
                  ariaLabel="Consent template"
                  options={activeTemplates.map((t) => ({
                    value: String(t._id),
                    label: `${t.name} (v${t.version})`,
                  }))}
                />
              </div>
              <div>
                <label className="label-field" htmlFor="assign-consent-patient">
                  Patient <RequiredMark />
                </label>
                <PatientPicker
                  id="assign-consent-patient"
                  value={assign.patientId}
                  onChange={(patientId) => setAssign({ ...assign, patientId })}
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? 'Assigning…' : 'Assign'}
              </button>
            </>
          )}
        </form>
      </Modal>

      <Modal open={!!sign} title="Patient consent" onClose={() => setSign(null)} wide>
        {sign && (
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-ink">{sign.titleSnapshot}</p>
              <p className="text-sm text-ink-muted">{sign.patientId?.name}</p>
            </div>
            <div className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto border border-line rounded-lg p-3 bg-[#fbfaf7]">
              {sign.bodySnapshot}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-ink-muted">Sign below — draw with cursor or finger</p>
              <button type="button" className="btn-ghost btn-sm" onClick={() => signatureRef.current?.clear()}>
                Clear
              </button>
            </div>
            <SignaturePad ref={signatureRef} />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={saving}
                onClick={() => submitSign('accepted')}
              >
                Accept
              </button>
              <button
                type="button"
                className="btn-danger flex-1"
                disabled={saving}
                onClick={() => submitSign('rejected')}
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
