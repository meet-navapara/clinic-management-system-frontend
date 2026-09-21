import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { Search } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import { SkeletonRows } from '../components/ui/Skeleton';
import RequiredMark from '../components/ui/RequiredMark';
import { ROUTES } from '../constants/routes';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { confirmAction } from '../utils/display';
import { PAGE_SIZE } from '../constants/pagination';

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
];

const AUDIENCES = [
  { value: 'all', label: 'All eligible patients' },
  { value: 'new', label: 'New patients (30 days)' },
  { value: 'inactive', label: 'Inactive / reactivation' },
  { value: 'followup', label: 'Booked as Follow-up' },
  { value: 'upcoming', label: 'Upcoming appointments' },
  { value: 'missed', label: 'Missed appointments' },
  { value: 'birthday', label: 'Birthday today' },
];

const TYPES = [
  { value: 'general', label: 'General announcement' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'appointment_reminder', label: 'Appointment reminder' },
  { value: 'reactivation', label: 'Reactivation' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'new_service', label: 'New service' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'missed_appointment', label: 'Missed appointment' },
  { value: 'health_camp', label: 'Health camp' },
];

const EMPTY = {
  name: '',
  description: '',
  campaignType: 'general',
  purpose: 'marketing',
  channel: 'whatsapp',
  audienceType: 'all',
  message: 'Hello {{patientName}},\n\nThis is a message from {{clinicName}}.\n\n— {{doctorName}}',
  subject: '',
  scheduledAt: '',
  inactiveDays: 90,
  upcomingHours: 48,
};

function fmt(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return isValid(d) ? format(d, 'd MMM yyyy, h:mm a') : '—';
}

function IntegrationBanner({ integrations, channel }) {
  if (!integrations) return null;
  const cfg =
    channel === 'whatsapp' ? integrations.whatsapp?.campaign : integrations[channel];
  if (!cfg) return null;
  if (cfg.configured) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        {channel === 'whatsapp'
          ? `WhatsApp campaign template approved (${cfg.campaignTemplate || cfg.approvedName})`
          : `EMAIL provider connected (${cfg.provider}).`}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <p className="font-semibold">
        {channel === 'whatsapp' ? 'Clinic WhatsApp template not approved' : 'Provider not configured'}
      </p>
      <p className="mt-1">
        {(cfg.missing || []).join(', ') ||
          (channel === 'whatsapp'
            ? 'Submit a template for Super Admin approval after MSG91 Meta approval.'
            : 'credentials')}
      </p>
    </div>
  );
}

export function CampaignsPage() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [tplForm, setTplForm] = useState({
    requestedName: 'clinic_campaign_update',
    sampleBody:
      'Hello {{1}},\n\n{{3}}\n\n— {{2}}',
    requestedBodyVars: 'patientName,clinicName,_message',
    category: 'MARKETING',
    language: 'en',
  });
  const [tplSaving, setTplSaving] = useState(false);

  const load = useCallback(
    (p = 1) => {
      setLoading(true);
      const params = { page: p, limit: PAGE_SIZE };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (channelFilter !== 'all') params.channel = channelFilter;
      if (search.trim()) params.q = search.trim();
      Promise.all([
        api.get('/campaigns', { params }),
        api.get('/campaigns/integrations/status').catch(() => ({ data: { integrations: null } })),
      ])
        .then(([listRes, intRes]) => {
          setRows(listRes.data.campaigns || []);
          setPage(listRes.data.page || 1);
          setPages(listRes.data.pages || 1);
          setTotal(listRes.data.total || 0);
          setIntegrations(intRes.data.integrations || null);
          const camp = intRes.data.integrations?.whatsapp?.campaign;
          if (camp?.requestedName) {
            setTplForm((f) => ({
              ...f,
              requestedName: camp.requestedName || f.requestedName,
              sampleBody: camp.sampleBody || f.sampleBody,
              requestedBodyVars: camp.requestedBodyVars || f.requestedBodyVars,
              category: camp.category || f.category,
              language: camp.language || f.language,
            }));
          }
        })
        .catch((err) => toast.error(err.response?.data?.message || 'Could not load campaigns.'))
        .finally(() => setLoading(false));
    },
    [statusFilter, channelFilter, search]
  );

  useEffect(() => {
    load(1);
  }, [branchId, load]);

  return (
    <div className="page-container">
      <PageHeader
        title="Campaigns"
        description="Message eligible patients via WhatsApp or Email when providers are configured."
        actions={
          <Link to={ROUTES.campaignNew} className="btn-primary">
            New campaign
          </Link>
        }
      />

      {integrations && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <div className="card !p-3 text-sm">
            <p className="font-semibold">WhatsApp (campaigns)</p>
            {integrations.whatsapp?.campaign?.configured ? (
              <>
                <p className="text-emerald-700">Approved for this clinic</p>
                <p className="text-xs text-ink-faint mt-1 font-mono">
                  Template: {integrations.whatsapp.campaign.campaignTemplate}
                </p>
              </>
            ) : (
              <>
                <p className="text-amber-700">
                  {integrations.whatsapp?.campaign?.status === 'pending'
                    ? 'Pending Super Admin approval'
                    : integrations.whatsapp?.campaign?.status === 'rejected'
                      ? 'Rejected — submit again'
                      : 'Not approved yet'}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  Appointment confirmation template is never used for campaigns. Doctor submits → Super
                  Admin creates on MSG91 → approves for your clinic.
                </p>
              </>
            )}
          </div>
          <div className="card !p-3 text-sm">
            <p className="font-semibold">Email</p>
            <p className={integrations.email?.configured ? 'text-emerald-700' : 'text-amber-700'}>
              {integrations.email?.configured ? 'Connected' : 'Not configured'}
            </p>
          </div>
        </div>
      )}

      {user?.role === 'doctor' &&
        integrations?.whatsapp?.campaign?.status !== 'approved' &&
        integrations?.whatsapp?.campaign?.status !== 'pending' && (
          <div className="card mb-4 space-y-3">
            <p className="font-semibold text-ink">Request WhatsApp campaign template</p>
            <p className="text-sm text-ink-muted">
              Super Admin will create this exact template on MSG91. After Meta shows Approved, they
              approve it for your clinic only.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label-field">Template name (MSG91)</label>
                <input
                  className="input-field font-mono"
                  value={tplForm.requestedName}
                  onChange={(e) => setTplForm((f) => ({ ...f, requestedName: e.target.value }))}
                  placeholder="clinic_campaign_update"
                />
              </div>
              <div>
                <label className="label-field">Body variable order</label>
                <input
                  className="input-field font-mono text-sm"
                  value={tplForm.requestedBodyVars}
                  onChange={(e) => setTplForm((f) => ({ ...f, requestedBodyVars: e.target.value }))}
                  placeholder="patientName,clinicName,_message"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label-field">Template body for MSG91 (use {'{{1}}'}, {'{{2}}'}, …)</label>
                <textarea
                  className="input-field"
                  rows={5}
                  value={tplForm.sampleBody}
                  onChange={(e) => setTplForm((f) => ({ ...f, sampleBody: e.target.value }))}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={tplSaving}
              onClick={async () => {
                setTplSaving(true);
                try {
                  const res = await api.post('/campaigns/whatsapp-template', tplForm);
                  toast.success(res.data.message || 'Submitted for Super Admin.');
                  load(page);
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Submit failed.');
                } finally {
                  setTplSaving(false);
                }
              }}
            >
              {tplSaving ? 'Submitting…' : 'Submit for Super Admin approval'}
            </button>
          </div>
        )}

      {user?.role === 'doctor' && integrations?.whatsapp?.campaign?.status === 'pending' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 mb-4">
          Template <code className="font-mono">{integrations.whatsapp.campaign.requestedName}</code> is
          waiting for Super Admin (MSG91 create + approve).
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form
          className="relative flex-1 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            className="input-field !pl-9"
            placeholder="Search by name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <select
          className="input-field sm:w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Status filter"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="partially_completed">Partial</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="input-field sm:w-36"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          aria-label="Channel filter"
        >
          <option value="all">All channels</option>
          {CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonRows count={PAGE_SIZE} />
      ) : !rows.length ? (
        <EmptyState
          title={search.trim() || statusFilter !== 'all' || channelFilter !== 'all' ? 'No matches' : 'No campaigns'}
          description={
            search.trim() || statusFilter !== 'all' || channelFilter !== 'all'
              ? 'Try another search or filter.'
              : 'Create a campaign to message eligible patients.'
          }
          action={
            !search.trim() && statusFilter === 'all' && channelFilter === 'all' ? (
              <Link to={ROUTES.campaignNew} className="btn-primary">
                New campaign
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <p className="text-xs text-ink-faint mb-2">
            {total} campaign{total === 1 ? '' : 's'}
            {pages > 1 ? ` · page ${page} of ${pages}` : ''}
          </p>
          <div className="hidden md:block card !p-0 overflow-hidden">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Channel</th>
                    <th>Audience</th>
                    <th>Status</th>
                    <th>Scheduled</th>
                    <th>Sent</th>
                    <th>Failed</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c._id}>
                      <td className="font-medium">{c.name}</td>
                      <td className="capitalize">{c.channel}</td>
                      <td className="capitalize text-ink-muted">{c.audienceType}</td>
                      <td>
                        <Badge value={c.status} />
                      </td>
                      <td className="text-ink-muted whitespace-nowrap">{fmt(c.scheduledAt)}</td>
                      <td>{c.sentCount ?? 0}</td>
                      <td>{c.failedCount ?? 0}</td>
                      <td className="text-right">
                        <Link to={ROUTES.campaign(c._id)} className="text-sm font-semibold text-accent-700">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="md:hidden space-y-2">
            {rows.map((c) => (
              <Link key={c._id} to={ROUTES.campaign(c._id)} className="card !p-4 block">
                <div className="flex justify-between gap-2">
                  <p className="font-semibold">{c.name}</p>
                  <Badge value={c.status} />
                </div>
                <p className="text-sm text-ink-muted capitalize mt-1">
                  {c.channel} · {c.audienceType}
                </p>
                <p className="text-xs text-ink-faint mt-1">
                  Sent {c.sentCount ?? 0} · Failed {c.failedCount ?? 0}
                </p>
              </Link>
            ))}
          </div>
          <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={load} />
        </>
      )}
    </div>
  );
}

export function CampaignEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isNew = !id;
  const [form, setForm] = useState(EMPTY);
  const [campaign, setCampaign] = useState(null);
  const [campaignId, setCampaignId] = useState(id || null);
  const [preview, setPreview] = useState(null);
  const [previewStale, setPreviewStale] = useState(false);
  const [integrations, setIntegrations] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryPages, setDeliveryPages] = useState(1);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [mode, setMode] = useState('now');

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setPreviewStale(true);
  };

  const applyDetail = (res, { syncForm = true } = {}) => {
    const c = res.data.campaign;
    setCampaign(c);
    setCampaignId(c._id);
    if (syncForm) {
      setForm({
        name: c.name || '',
        description: c.description || '',
        campaignType: c.campaignType || 'general',
        purpose: c.purpose || 'marketing',
        channel: c.channel === 'sms' ? 'whatsapp' : c.channel || 'whatsapp',
        audienceType: c.audienceType || 'all',
        message: c.message || '',
        subject: c.subject || '',
        scheduledAt: c.scheduledAt ? format(new Date(c.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '',
        inactiveDays: c.audienceFilter?.inactiveDays || 90,
        upcomingHours: c.audienceFilter?.upcomingHours || 48,
      });
      setPreviewStale(false);
      if (c.scheduledAt && new Date(c.scheduledAt) > new Date()) setMode('schedule');
    }
    setDeliveries(res.data.deliveries || []);
    setDeliveryPage(res.data.page || 1);
    setDeliveryPages(res.data.pages || 1);
    setDeliveryTotal(res.data.total || 0);
    setAnalytics(res.data.analytics || null);
    setIntegrations(res.data.integrations || null);
  };

  const loadDetail = async (cid, delPage = 1, { syncForm = true } = {}) => {
    const res = await api.get(`/campaigns/${cid}`, { params: { page: delPage, limit: PAGE_SIZE } });
    applyDetail(res, { syncForm });
    return res.data.campaign;
  };

  const runPreview = async (cid, channel) => {
    const res = await api.post(`/campaigns/${cid}/preview`);
    setPreview(res.data);
    setPreviewStale(false);
    if (res.data.integrationStatus) {
      setIntegrations((prev) => {
        if (channel === 'whatsapp') {
          return {
            ...(prev || {}),
            whatsapp: {
              ...(prev?.whatsapp || {}),
              campaign: res.data.integrationStatus || prev?.whatsapp?.campaign,
            },
          };
        }
        return { ...(prev || {}), [channel]: res.data.integrationStatus };
      });
    }
  };

  useEffect(() => {
    api
      .get('/campaigns/integrations/status')
      .then((res) => setIntegrations(res.data.integrations))
      .catch(() => {});
    if (!id) return;
    const wantsPreview = searchParams.get('preview') === '1';
    loadDetail(id)
      .then((c) => {
        if (!wantsPreview) return;
        setSearchParams({}, { replace: true });
        return runPreview(id, c?.channel || 'whatsapp');
      })
      .catch(() => toast.error('Campaign not found.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Light poll while campaign is actively sending — do not overwrite the form
  useEffect(() => {
    if (!campaignId) return undefined;
    if (!['queued', 'processing', 'scheduled'].includes(campaign?.status)) return undefined;
    const t = setInterval(() => {
      loadDetail(campaignId, deliveryPage, { syncForm: false }).catch(() => {});
    }, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, campaign?.status, deliveryPage]);

  const buildPayload = () => ({
    name: form.name.trim(),
    description: form.description.trim(),
    campaignType: form.campaignType,
    purpose: form.purpose,
    channel: form.channel,
    audienceType: form.audienceType,
    message: form.message,
    subject: form.subject,
    scheduledAt: mode === 'schedule' && form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    audienceFilter: {
      inactiveDays: Number(form.inactiveDays) || 90,
      upcomingHours: Number(form.upcomingHours) || 48,
    },
  });

  const save = async (e, { silent = false, previewAfter = false } = {}) => {
    e?.preventDefault?.();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Name and message are required.');
      return null;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (campaignId) {
        const res = await api.patch(`/campaigns/${campaignId}`, payload);
        setCampaign(res.data.campaign);
        if (!silent) toast.success('Draft saved.');
        return res.data.campaign._id;
      }
      const res = await api.post('/campaigns', payload);
      const newId = res.data.campaign._id;
      setCampaignId(newId);
      setCampaign(res.data.campaign);
      navigate(previewAfter ? `${ROUTES.campaign(newId)}?preview=1` : ROUTES.campaign(newId), {
        replace: true,
      });
      if (!silent) toast.success('Draft created.');
      return newId;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const doPreview = async () => {
    // New draft: create then land on detail with ?preview=1 so remount still shows preview
    if (!campaignId) {
      await save(null, { silent: true, previewAfter: true });
      return;
    }
    if (editable) {
      const cid = await save(null, { silent: true });
      if (!cid) return;
    }
    try {
      await runPreview(campaignId, form.channel);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Preview failed.');
    }
  };

  const sendTest = async () => {
    if (!campaignId) {
      toast.error('Save the campaign first.');
      return;
    }
    if (previewStale && editable) {
      const cid = await save(null, { silent: true });
      if (!cid) return;
    }
    const waOk = form.channel !== 'whatsapp' || integrations?.whatsapp?.campaign?.configured;
    const emailOk = form.channel !== 'email' || integrations?.email?.configured;
    if (!waOk || !emailOk) {
      toast.error(
        form.channel === 'whatsapp'
          ? 'Clinic WhatsApp campaign template is not approved yet.'
          : 'Email provider is not configured.'
      );
      return;
    }
    if (!testTo.trim()) {
      toast.error(form.channel === 'email' ? 'Enter a test email.' : 'Enter a test phone number.');
      return;
    }
    try {
      const body =
        form.channel === 'email' ? { toEmail: testTo.trim() } : { toPhone: testTo.trim() };
      const res = await api.post(`/campaigns/${campaignId}/test`, body);
      toast.success(`Test accepted by provider · ID ${res.data.providerMessageId || 'n/a'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test send failed.');
    }
  };

  const send = async () => {
    if (!preview) return toast.error('Preview recipients first.');
    if (previewStale) return toast.error('Audience changed — preview again before sending.');
    if (!preview.channelConfigured) {
      return toast.error(
        form.channel === 'whatsapp'
          ? 'Clinic WhatsApp campaign template is not approved by Super Admin yet.'
          : 'Email provider is not configured.'
      );
    }
    const label =
      mode === 'schedule'
        ? `Schedule send to ${preview.eligibleCount} eligible patients?`
        : `Send now to ${preview.eligibleCount} eligible patients via ${preview.channel}?`;
    if (!(await confirmAction(label))) return;
    try {
      const res = await api.post(`/campaigns/${campaignId}/send`, {
        confirm: true,
        sendNow: mode === 'now',
      });
      toast.success(res.data.message || 'Campaign queued.');
      setPreview(null);
      await loadDetail(campaignId, 1, { syncForm: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed.');
    }
  };

  const cancel = async () => {
    if (!(await confirmAction('Cancel this campaign?'))) return;
    try {
      await api.post(`/campaigns/${campaignId}/cancel`);
      toast.success('Campaign cancelled.');
      await loadDetail(campaignId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed.');
    }
  };

  const retry = async () => {
    if (!(await confirmAction('Re-queue failed recipients only? Already-sent patients will not be retried.'))) return;
    try {
      const res = await api.post(`/campaigns/${campaignId}/retry-failed`);
      toast.success(`Re-queued ${res.data.requeued || 0} failed recipients.`);
      await loadDetail(campaignId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed.');
    }
  };

  const duplicate = async () => {
    try {
      const res = await api.post(`/campaigns/${campaignId}/duplicate`);
      toast.success('Campaign duplicated.');
      navigate(ROUTES.campaign(res.data.campaign._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Duplicate failed.');
    }
  };

  const editable = !campaign || ['draft', 'scheduled'].includes(campaign.status);

  return (
    <div className="page-container max-w-5xl">
      <PageHeader
        title={isNew ? 'New campaign' : campaign?.name || 'Campaign'}
        description={
          campaign ? (
            <span className="inline-flex items-center gap-2">
              <Badge value={campaign.status} />
              <span className="capitalize text-ink-muted">{campaign.channel}</span>
            </span>
          ) : (
            'Draft a message, preview eligible patients, then send after WhatsApp template approval (or Email is configured).'
          )
        }
        actions={
          campaignId && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={duplicate}>
                Duplicate
              </button>
              {['draft', 'scheduled', 'queued', 'processing'].includes(campaign?.status) && (
                <button type="button" className="btn-danger" onClick={cancel}>
                  Cancel
                </button>
              )}
              {['failed', 'partially_completed'].includes(campaign?.status) && (
                <button type="button" className="btn-secondary" onClick={retry}>
                  Retry failed
                </button>
              )}
            </div>
          )
        }
      />

      <IntegrationBanner integrations={integrations} channel={form.channel} />

      <form onSubmit={save} className="card space-y-4 mt-4">
        <fieldset disabled={saving || !editable} className="space-y-4 border-0 p-0 m-0">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label-field">
                Campaign name <RequiredMark />
              </label>
              <input
                className="input-field"
                required
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            </div>
            <div>
              <label className="label-field">Campaign type</label>
              <select
                className="input-field"
                value={form.campaignType}
                onChange={(e) => setField('campaignType', e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Purpose</label>
              <select
                className="input-field"
                value={form.purpose}
                onChange={(e) => setField('purpose', e.target.value)}
              >
                <option value="marketing">Marketing</option>
                <option value="transactional">Transactional</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Description</label>
              <input
                className="input-field"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </div>
            <div>
              <label className="label-field">
                Channel <RequiredMark />
              </label>
              <select
                className="input-field"
                value={form.channel}
                onChange={(e) => setField('channel', e.target.value)}
              >
                {CHANNELS.map((c) => {
                  const ok =
                    c.value === 'whatsapp'
                      ? integrations?.whatsapp?.campaign?.configured
                      : integrations?.[c.value]?.configured;
                  return (
                    <option key={c.value} value={c.value}>
                      {c.label}
                      {ok ? '' : ' — not configured'}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="label-field">
                Audience <RequiredMark />
              </label>
              <select
                className="input-field"
                value={form.audienceType}
                onChange={(e) => setField('audienceType', e.target.value)}
              >
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            {form.audienceType === 'inactive' && (
              <div>
                <label className="label-field">Inactive days</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={form.inactiveDays}
                  onChange={(e) => setField('inactiveDays', e.target.value)}
                />
              </div>
            )}
            {form.audienceType === 'upcoming' && (
              <div>
                <label className="label-field">Upcoming hours</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={form.upcomingHours}
                  onChange={(e) => setField('upcomingHours', e.target.value)}
                />
              </div>
            )}
            {form.channel === 'email' && (
              <div className="sm:col-span-2">
                <label className="label-field">Email subject</label>
                <input
                  className="input-field"
                  value={form.subject}
                  onChange={(e) => setField('subject', e.target.value)}
                  placeholder="Subject with {{clinicName}}"
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="label-field">
                Message <RequiredMark />
              </label>
              <textarea
                className="input-field"
                rows={6}
                required
                value={form.message}
                onChange={(e) => setField('message', e.target.value)}
              />
              <p className="text-xs text-ink-faint mt-1">
                Variables: {'{{patientName}}'}, {'{{doctorName}}'}, {'{{clinicName}}'}, {'{{branchName}}'},{' '}
                {'{{appointmentDate}}'}, {'{{appointmentTime}}'}, {'{{followUpDate}}'}, {'{{campaignName}}'}
              </p>
              {form.channel === 'whatsapp' && (
                <p className="text-xs text-amber-900 mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  WhatsApp campaigns only send after Super Admin approves <strong>your clinic’s</strong>{' '}
                  MSG91 template. The message box fills <code className="font-mono">_message</code> when
                  that variable is mapped — it never uses the appointment confirmation template.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={mode === 'now'} onChange={() => setMode('now')} />
              Send now
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={mode === 'schedule'} onChange={() => setMode('schedule')} />
              Schedule
            </label>
            {mode === 'schedule' && (
              <input
                type="datetime-local"
                className="input-field max-w-xs"
                value={form.scheduledAt}
                onChange={(e) => setField('scheduledAt', e.target.value)}
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-secondary" disabled={saving || !editable}>
              {saving ? 'Saving...' : 'Save draft'}
            </button>
            <button type="button" className="btn-secondary" onClick={doPreview} disabled={!editable && !campaignId}>
              Preview audience
            </button>
          </div>
        </fieldset>
      </form>

      {preview && (
        <div className="card mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Audience preview</p>
            {previewStale && (
              <p className="text-sm text-amber-800 font-medium">
                Settings changed — preview again before sending.
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg bg-[#f7f4ef] p-3">
              Total <strong>{preview.recipientCount}</strong>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              Eligible <strong>{preview.eligibleCount}</strong>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              Excluded <strong>{preview.excludedCount}</strong>
            </div>
          </div>
          {preview.reasonCounts && Object.keys(preview.reasonCounts).length > 0 && (
            <ul className="text-sm text-ink-muted list-disc pl-5">
              {Object.entries(preview.reasonCounts).map(([k, v]) => (
                <li key={k}>
                  {k.replace(/_/g, ' ')}: {v}
                </li>
              ))}
            </ul>
          )}
          {Array.isArray(preview.preview) && preview.preview.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-faint mb-2">
                Sample eligible recipients (up to 20)
              </p>
              <ul className="text-sm divide-y divide-line rounded-lg border border-line overflow-hidden">
                {preview.preview.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3 px-3 py-2 bg-white">
                    <span className="font-medium truncate">{p.name}</span>
                    <span className="text-ink-muted shrink-0 text-xs sm:text-sm">
                      {p.phone || p.email || '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-lg border border-line p-3 bg-white">
            <p className="text-xs uppercase tracking-wide text-ink-faint mb-2">{preview.channel} preview</p>
            <pre className="whitespace-pre-wrap text-sm font-sans">{preview.messagePreview}</pre>
          </div>
          {!preview.channelConfigured && (
            <p className="text-sm text-amber-800 font-medium">
              {form.channel === 'whatsapp'
                ? 'WhatsApp campaigns need your clinic template approved by Super Admin (after MSG91 Meta approval).'
                : 'Email integration required — configure Resend before sending.'}
            </p>
          )}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-0 w-full sm:min-w-[180px]">
              <label className="label-field">
                Send test {form.channel === 'email' ? 'email' : 'phone'}
              </label>
              <input
                className="input-field"
                placeholder={form.channel === 'email' ? 'you@example.com' : '9876543210'}
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={sendTest}
              disabled={
                !preview.channelConfigured ||
                (form.channel === 'whatsapp' && !integrations?.whatsapp?.campaign?.configured) ||
                (form.channel === 'email' && !integrations?.email?.configured)
              }
            >
              Send test
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={send}
              disabled={previewStale || !preview.channelConfigured || preview.eligibleCount < 1}
            >
              {mode === 'schedule' ? 'Confirm schedule' : 'Confirm send'}
            </button>
          </div>
        </div>
      )}

      {analytics && campaign && !['draft'].includes(campaign.status) && (
        <div className="card mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Delivery analytics</p>
            {['queued', 'processing', 'scheduled'].includes(campaign.status) && (
              <p className="text-xs text-ink-faint">Refreshing every few seconds…</p>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {[
              ['Recipients', analytics.recipients],
              ['Queued', analytics.queued],
              ['Sent', analytics.sent],
              ['Delivered', analytics.delivered],
              ['Failed', analytics.failed],
              ['Skipped', analytics.skipped],
              ['Delivery rate', analytics.deliveryRate != null ? `${analytics.deliveryRate}%` : 'Not available'],
              ['Failure rate', analytics.failureRate != null ? `${analytics.failureRate}%` : 'Not available'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[#f7f4ef] p-3">
                <p className="text-xs text-ink-faint">{label}</p>
                <p className="font-semibold mt-1">{value}</p>
              </div>
            ))}
          </div>
          {!!deliveries.length ? (
            <>
              <p className="text-xs text-ink-faint">
                {deliveryTotal} delivery record{deliveryTotal === 1 ? '' : 's'}
                {deliveryPages > 1 ? ` · page ${deliveryPage} of ${deliveryPages}` : ''}
              </p>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Status</th>
                      <th>Provider ID</th>
                      <th>Sent</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d) => (
                      <tr key={d._id}>
                        <td>
                          {d.recipientName}
                          <div className="text-xs text-ink-faint">{d.recipientPhone || d.recipientEmail}</div>
                        </td>
                        <td>
                          <Badge value={d.status} />
                        </td>
                        <td className="font-mono text-xs">{d.providerMessageId || '—'}</td>
                        <td className="text-xs whitespace-nowrap">{fmt(d.sentAt)}</td>
                        <td className="text-xs text-red-700">{d.failureReason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={deliveryPage}
                pages={deliveryPages}
                total={deliveryTotal}
                limit={PAGE_SIZE}
                onPage={(p) => loadDetail(campaignId, p, { syncForm: false })}
              />
            </>
          ) : (
            <p className="text-sm text-ink-muted">No delivery records yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
