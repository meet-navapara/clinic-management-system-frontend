import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import { format, isValid } from 'date-fns';

/**
 * Super Admin reviews doctor-submitted WhatsApp campaign templates.
 * After creating the template on MSG91 and Meta shows Approved, approve it for that clinic.
 */
export default function AdminCampaignTemplatesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState('');
  const [approveForm, setApproveForm] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/campaign-whatsapp-templates', { params: { status: filter } })
      .then((res) => setRows(res.data.clinics || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load templates.'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (clinicId, action) => {
    const form = approveForm[clinicId] || {};
    setBusyId(clinicId);
    try {
      const res = await api.patch(`/admin/campaign-whatsapp-templates/${clinicId}`, {
        action,
        approvedName: form.approvedName,
        approvedBodyVars: form.approvedBodyVars,
        reviewNote: form.reviewNote,
      });
      toast.success(res.data.message || (action === 'approve' ? 'Approved.' : 'Rejected.'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setBusyId('');
    }
  };

  const setForm = (clinicId, patch) => {
    setApproveForm((prev) => ({
      ...prev,
      [clinicId]: { ...(prev[clinicId] || {}), ...patch },
    }));
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Campaign WhatsApp templates"
        description="Doctors submit a template request. Create it on MSG91, wait for Meta Approved, then approve for that clinic only."
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <button
            key={s}
            type="button"
            className={filter === s ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonRows count={4} />
      ) : !rows.length ? (
        <EmptyState title="No templates" description="Nothing in this filter." />
      ) : (
        <div className="space-y-4">
          {rows.map((c) => {
            const t = c.template || {};
            const form = approveForm[c._id] || {
              approvedName: t.requestedName || '',
              approvedBodyVars: t.requestedBodyVars || 'patientName,clinicName,_message',
              reviewNote: '',
            };
            return (
              <article key={c._id} className="card space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-ink-faint">
                      {c.slug}
                      {t.submittedAt && isValid(new Date(t.submittedAt))
                        ? ` · submitted ${format(new Date(t.submittedAt), 'd MMM yyyy, h:mm a')}`
                        : ''}
                      {t.submittedBy?.name ? ` · by ${t.submittedBy.name}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {t.status}
                  </span>
                </div>

                <div className="rounded-lg border border-line bg-[#faf8f3] p-3 text-sm space-y-1">
                  <p>
                    <span className="text-ink-faint">Requested name: </span>
                    <code className="font-mono">{t.requestedName || '—'}</code>
                  </p>
                  <p>
                    <span className="text-ink-faint">Category / lang: </span>
                    {t.category || 'MARKETING'} · {t.language || 'en'}
                  </p>
                  <p>
                    <span className="text-ink-faint">Body vars: </span>
                    <code className="font-mono text-xs">{t.requestedBodyVars || '—'}</code>
                  </p>
                  <p className="whitespace-pre-wrap mt-2 border-t border-line pt-2">{t.sampleBody || '—'}</p>
                </div>

                {t.status === 'pending' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label-field">MSG91 approved template name</label>
                      <input
                        className="input-field font-mono"
                        value={form.approvedName}
                        onChange={(e) => setForm(c._id, { approvedName: e.target.value })}
                        placeholder="clinic_campaign_update"
                      />
                    </div>
                    <div>
                      <label className="label-field">Body vars order (matches MSG91 body_1, body_2…)</label>
                      <input
                        className="input-field font-mono text-sm"
                        value={form.approvedBodyVars}
                        onChange={(e) => setForm(c._id, { approvedBodyVars: e.target.value })}
                        placeholder="patientName,clinicName,_message"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label-field">Note (optional)</label>
                      <input
                        className="input-field"
                        value={form.reviewNote}
                        onChange={(e) => setForm(c._id, { reviewNote: e.target.value })}
                        placeholder="Created on MSG91 · Meta Approved"
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busyId === c._id}
                        onClick={() => review(c._id, 'approve')}
                      >
                        {busyId === c._id ? 'Saving…' : 'Approve for clinic'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary text-red-700"
                        disabled={busyId === c._id}
                        onClick={() => review(c._id, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {t.status === 'approved' && (
                  <p className="text-sm text-emerald-800">
                    Live template: <code className="font-mono">{t.approvedName}</code>
                    {t.approvedBodyVars ? (
                      <>
                        {' '}
                        · vars <code className="font-mono text-xs">{t.approvedBodyVars}</code>
                      </>
                    ) : null}
                  </p>
                )}
                {t.status === 'rejected' && t.reviewNote ? (
                  <p className="text-sm text-amber-900">Note: {t.reviewNote}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
