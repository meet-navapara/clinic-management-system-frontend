import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, isValid } from 'date-fns';
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
import { confirmAction } from '../utils/display';
import { PAGE_SIZE } from '../constants/pagination';

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
];

const AUDIENCES = [
  { value: 'all', label: 'All eligible patients' },
  { value: 'new', label: 'New patients (30 days)' },
  { value: 'inactive', label: 'Inactive / reactivation' },
  { value: 'followup', label: 'Follow-up due' },
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
  const cfg = integrations[channel];
  if (!cfg) return null;
  if (cfg.configured) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        {channel.toUpperCase()} provider connected ({cfg.provider}).
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <p className="font-semibold">Provider not configured</p>
      <p className="mt-1">
        {channel.toUpperCase()} integration required before sending. Missing:{' '}
        {(cfg.missing || []).join(', ') || 'credentials'}.
      </p>
    </div>
  );
}

export function CampaignsPage() {
  const { branchId } = useBranch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(
    (p = 1) => {
      setLoading(true);
      Promise.all([
        api.get('/campaigns', { params: { page: p, limit: PAGE_SIZE } }),
        api.get('/campaigns/integrations/status').catch(() => ({ data: { integrations: null } })),
      ])
        .then(([listRes, intRes]) => {
          setRows(listRes.data.campaigns || []);
          setPage(listRes.data.page || 1);
          setPages(listRes.data.pages || 1);
          setTotal(listRes.data.total || 0);
          setIntegrations(intRes.data.integrations || null);
        })
        .catch((err) => toast.error(err.response?.data?.message || 'Could not load campaigns.'))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    load(1);
  }, [branchId, load]);

  return (
    <div className="page-container">
      <PageHeader
        title="Campaigns"
        description="Real clinic messaging via configured WhatsApp, SMS, or Email providers."
        actions={
          <Link to={ROUTES.campaignNew} className="btn-primary">
            New campaign
          </Link>
        }
      />

      {integrations && (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {['whatsapp', 'sms', 'email'].map((ch) => (
            <div key={ch} className="card !p-3 text-sm">
              <p className="font-semibold capitalize">{ch}</p>
              <p className={integrations[ch]?.configured ? 'text-emerald-700' : 'text-amber-700'}>
                {integrations[ch]?.configured ? 'Connected' : 'Not configured'}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonRows count={PAGE_SIZE} />
      ) : !rows.length ? (
        <EmptyState title="No campaigns" description="Create a campaign to message eligible patients." />
      ) : (
        <>
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
  const isNew = !id;
  const [form, setForm] = useState(EMPTY);
  const [campaign, setCampaign] = useState(null);
  const [campaignId, setCampaignId] = useState(id || null);
  const [preview, setPreview] = useState(null);
  const [integrations, setIntegrations] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [mode, setMode] = useState('now');

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const loadDetail = async (cid) => {
    const res = await api.get(`/campaigns/${cid}`);
    const c = res.data.campaign;
    setCampaign(c);
    setCampaignId(c._id);
    setForm({
      name: c.name || '',
      description: c.description || '',
      campaignType: c.campaignType || 'general',
      purpose: c.purpose || 'marketing',
      channel: c.channel || 'whatsapp',
      audienceType: c.audienceType || 'all',
      message: c.message || '',
      subject: c.subject || '',
      scheduledAt: c.scheduledAt ? format(new Date(c.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '',
      inactiveDays: c.audienceFilter?.inactiveDays || 90,
      upcomingHours: c.audienceFilter?.upcomingHours || 48,
    });
    setDeliveries(res.data.deliveries || []);
    setAnalytics(res.data.analytics || null);
    setIntegrations(res.data.integrations || null);
    if (c.scheduledAt && new Date(c.scheduledAt) > new Date()) setMode('schedule');
  };

  useEffect(() => {
    api
      .get('/campaigns/integrations/status')
      .then((res) => setIntegrations(res.data.integrations))
      .catch(() => {});
    if (!id) return;
    loadDetail(id).catch(() => toast.error('Campaign not found.'));
  }, [id]);

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

  const save = async (e) => {
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
        toast.success('Draft saved.');
        return res.data.campaign._id;
      }
      const res = await api.post('/campaigns', payload);
      setCampaignId(res.data.campaign._id);
      setCampaign(res.data.campaign);
      navigate(ROUTES.campaign(res.data.campaign._id), { replace: true });
      toast.success('Draft created.');
      return res.data.campaign._id;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const doPreview = async () => {
    let cid = campaignId;
    if (!cid) cid = await save();
    if (!cid) return;
    try {
      const res = await api.post(`/campaigns/${cid}/preview`);
      setPreview(res.data);
      if (res.data.integrationStatus) {
        setIntegrations((prev) => ({ ...(prev || {}), [form.channel]: res.data.integrationStatus }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Preview failed.');
    }
  };

  const sendTest = async () => {
    if (!campaignId) {
      toast.error('Save the campaign first.');
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
    if (!preview.channelConfigured) {
      return toast.error('Provider not configured. Integration required before sending.');
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
      await loadDetail(campaignId);
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
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                    {integrations?.[c.value]?.configured ? '' : ' — not configured'}
                  </option>
                ))}
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
          <p className="font-semibold">Audience preview</p>
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
          <div className="rounded-lg border border-line p-3 bg-white">
            <p className="text-xs uppercase tracking-wide text-ink-faint mb-2">{preview.channel} preview</p>
            <pre className="whitespace-pre-wrap text-sm font-sans">{preview.messagePreview}</pre>
          </div>
          {!preview.channelConfigured && (
            <p className="text-sm text-amber-800 font-medium">
              Integration required — sending is blocked until the provider is configured.
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
            <button type="button" className="btn-secondary" onClick={sendTest}>
              Send test
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={send}
              disabled={!preview.channelConfigured || preview.eligibleCount < 1}
            >
              {mode === 'schedule' ? 'Confirm schedule' : 'Confirm send'}
            </button>
          </div>
        </div>
      )}

      {analytics && campaign && !['draft'].includes(campaign.status) && (
        <div className="card mt-4 space-y-3">
          <p className="font-semibold">Delivery analytics</p>
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
          {!!deliveries.length && (
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
          )}
        </div>
      )}
    </div>
  );
}
