import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { ROUTES } from '../constants/routes';
import { useBranch } from '../context/BranchContext';

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
    <div className="page-container max-w-2xl">
      <PageHeader title={isNew ? 'New campaign' : 'Campaign'} />
      <form onSubmit={save} className="card space-y-3">
        <input className="input-field" required placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="input-field" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS (log only unless a provider is configured)</option>
          <option value="email">Email (log only unless a provider is configured)</option>
        </select>
        <select className="input-field" value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value })}>
          {['all', 'new', 'inactive', 'followup', 'doctor', 'branch', 'selected'].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <textarea className="input-field" rows={5} required placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
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
