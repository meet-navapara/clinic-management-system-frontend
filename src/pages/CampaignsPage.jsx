import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Dropdown from '../components/ui/Dropdown';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { ROUTES } from '../constants/routes';
import { useBranch } from '../context/BranchContext';
import RequiredMark from '../components/ui/RequiredMark';

export function CampaignsPage() {
  const { branchId } = useBranch();
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/campaigns').then((res) => setRows(res.data.campaigns || [])).catch(() => {});
  }, [branchId]);
  return (
    <div className="page-container">
      <PageHeader title="Campaigns" actions={<Link to={ROUTES.campaignNew} className="btn-primary">New campaign</Link>} />
      {!rows.length ? <EmptyState title="No campaigns" /> : (
        <div className="space-y-2">
          {rows.map((c) => (
            <Link key={c._id} to={ROUTES.campaign(c._id)} className="card !p-4 flex justify-between gap-3">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-ink-muted capitalize">{c.channel} · {c.audienceType} · {c.recipientCount} recipients</p>
              </div>
              <Badge value={c.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function CampaignEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [form, setForm] = useState({ name: '', message: '', channel: 'whatsapp', audienceType: 'all' });
  const [preview, setPreview] = useState(null);
  const [campaignId, setCampaignId] = useState(id || null);

  const save = async (e) => {
    e?.preventDefault?.();
    try {
      if (campaignId) {
        await api.patch(`/campaigns/${campaignId}`, form);
        toast.success('Saved.');
      } else {
        const res = await api.post('/campaigns', form);
        setCampaignId(res.data.campaign._id);
        navigate(ROUTES.campaign(res.data.campaign._id), { replace: true });
        toast.success('Draft created.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    }
  };

  const doPreview = async () => {
    if (!campaignId) await save();
    const cid = campaignId;
    if (!cid) return;
    try {
      const res = await api.post(`/campaigns/${cid}/preview`);
      setPreview(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Preview failed.');
    }
  };

  const send = async () => {
    if (!preview) return toast.error('Preview recipients first.');
    if (!window.confirm(`Send to ${preview.recipientCount} patients via ${preview.channel}?`)) return;
    try {
      await api.post(`/campaigns/${campaignId}/send`, { confirm: true });
      toast.success('Campaign processed.');
      navigate(ROUTES.campaigns);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed.');
    }
  };

  useEffect(() => {
    if (!id) return;
    api.get(`/campaigns/${id}`).then((res) => {
      const c = res.data.campaign;
      setForm({ name: c.name, message: c.message, channel: c.channel, audienceType: c.audienceType });
      setCampaignId(c._id);
    }).catch(() => {});
  }, [id]);

  return (
    <div className="page-container">
      <PageHeader title={isNew ? 'New campaign' : 'Campaign'} />
      <form onSubmit={save} className="card space-y-3">
        <div>
          <label className="label-field">Campaign name <RequiredMark /></label>
          <input className="input-field" required placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label-field">Channel <RequiredMark /></label>
          <Dropdown
          value={form.channel}
          onChange={(channel) => setForm({ ...form, channel })}
          ariaLabel="Channel"
          options={[
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'sms', label: 'SMS (log only unless a provider is configured)' },
            { value: 'email', label: 'Email (log only unless a provider is configured)' },
          ]}
          />
        </div>
        <div>
          <label className="label-field">Audience <RequiredMark /></label>
          <Dropdown
          value={form.audienceType}
          onChange={(audienceType) => setForm({ ...form, audienceType })}
          ariaLabel="Audience"
          options={['all', 'new', 'inactive', 'followup', 'doctor', 'branch', 'selected']}
          />
        </div>
        <div>
          <label className="label-field">Message <RequiredMark /></label>
          <textarea className="input-field" rows={5} required placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-secondary">Save draft</button>
          <button type="button" className="btn-secondary" onClick={doPreview}>Preview recipients</button>
        </div>
      </form>
      {preview && (
        <div className="card mt-4 space-y-2">
          <p className="font-semibold">Recipients: {preview.recipientCount}</p>
          <p className="text-sm text-ink-muted capitalize">Channel: {preview.channel}</p>
          <p className="text-sm whitespace-pre-wrap">{preview.message}</p>
          <button type="button" className="btn-primary" onClick={send}>Confirm send</button>
        </div>
      )}
    </div>
  );
}
