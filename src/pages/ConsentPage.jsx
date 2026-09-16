import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Dropdown from '../components/ui/Dropdown';
import PatientPicker from '../components/PatientPicker';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import { useBranch } from '../context/BranchContext';
import RequiredMark from '../components/ui/RequiredMark';
import SignaturePad from '../components/SignaturePad';
import { SkeletonCards, SkeletonRows } from '../components/ui/Skeleton';
import LoadingOverlay from '../components/ui/LoadingOverlay';

const EMPTY_ASSIGN = { consentTemplateId: '', patientId: '' };
const EMPTY_FORM = { name: '', category: 'general', body: '' };

export default function ConsentPage() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [templates, setTemplates] = useState([]);
  const [records, setRecords] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [sign, setSign] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [assign, setAssign] = useState(EMPTY_ASSIGN);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const signatureRef = useRef(null);

  const load = (showLoader = false) => {
    if (showLoader) setLoading(true);
    Promise.all([
      api
        .get('/consent/templates', { params: { active: 'all' } })
        .then((res) => setTemplates(res.data.templates || []))
        .catch((err) => toast.error(err.response?.data?.message || 'Could not load consent templates.')),
      api
        .get('/consent/records')
        .then((res) => setRecords(res.data.records || []))
        .catch((err) => toast.error(err.response?.data?.message || 'Could not load consent records.')),
    ]).finally(() => setLoading(false));
  };
  useEffect(() => {
    load(true);
  }, [branchId]);

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

  const saveTpl = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/consent/templates/${editingId}`, form);
        toast.success('Template updated.');
      } else {
        await api.post('/consent/templates', form);
        toast.success('Template created.');
      }
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      load();
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
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    }
  };

  const doAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/consent/records', assign);
      toast.success('Consent assigned.');
      setAssignOpen(false);
      setAssign(EMPTY_ASSIGN);
      load();
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
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign failed.');
    } finally {
      setSaving(false);
    }
  };

  const activeTemplates = templates.filter((t) => t.isActive !== false);

  return (
    <div className="page-container relative">
      <LoadingOverlay show={saving} message="Saving…" />
      <PageHeader
        title="Consent forms"
        actions={
          <div className="flex flex-wrap gap-2">
            {can(user, P.CONSENT_CAPTURE) && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setAssign(EMPTY_ASSIGN);
                  setAssignOpen(true);
                }}
              >
                Assign to patient
              </button>
            )}
            {can(user, P.CONSENT_TEMPLATES) && (
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
        <EmptyState title="No templates" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {templates.map((t) => (
            <div key={t._id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-ink-faint">
                    v{t.version} · {t.category}
                    {t.isActive === false ? ' · inactive' : ''}
                  </p>
                </div>
                <Badge value={t.isActive === false ? 'inactive' : 'active'} />
              </div>
              {can(user, P.CONSENT_TEMPLATES) && (
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
      <h3 className="text-sm font-semibold mb-2">Records</h3>
      {!records.length ? (
        <EmptyState title="No consent records" />
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r._id} className="card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-medium">{r.titleSnapshot}</p>
                <p className="text-sm text-ink-muted">
                  {r.patientId?.name} · v{r.version}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge value={r.status} />
                {r.status === 'pending' && can(user, P.CONSENT_CAPTURE) && (
                  <button type="button" className="btn-primary btn-sm" onClick={() => setSign(r)}>
                    Capture
                  </button>
                )}
                <Link className="btn-ghost btn-sm" to={ROUTES.print('consent', r._id)} target="_blank" rel="noreferrer">
                  Print
                </Link>
              </div>
            </div>
          ))}
        </div>
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
              placeholder="Name"
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
              placeholder="Consent text"
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
              options={activeTemplates.map((t) => ({ value: String(t._id), label: t.name }))}
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
        </form>
      </Modal>

      <Modal open={!!sign} title="Patient consent" onClose={() => setSign(null)} wide>
        {sign && (
          <div className="space-y-3">
            <p className="font-semibold">{sign.titleSnapshot}</p>
            <div className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto border border-line rounded-lg p-3">
              {sign.bodySnapshot}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-ink-muted">Sign below — draw with your cursor or finger</p>
              <button type="button" className="btn-ghost btn-sm" onClick={() => signatureRef.current?.clear()}>
                Clear
              </button>
            </div>
            <SignaturePad ref={signatureRef} />
            <div className="flex gap-2">
              <button type="button" className="btn-primary flex-1" disabled={saving} onClick={() => submitSign('accepted')}>
                Accept
              </button>
              <button type="button" className="btn-danger flex-1" disabled={saving} onClick={() => submitSign('rejected')}>
                Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
