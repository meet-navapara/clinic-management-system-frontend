import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import { useBranch } from '../context/BranchContext';

export default function ConsentPage() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const [templates, setTemplates] = useState([]);
  const [records, setRecords] = useState([]);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [sign, setSign] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'general', body: '' });
  const [assign, setAssign] = useState({ consentTemplateId: '', patientId: '', q: '' });
  const [patients, setPatients] = useState([]);
  const canvasRef = useRef(null);

  const load = () => {
    api.get('/consent/templates').then((res) => setTemplates(res.data.templates || [])).catch(() => {});
    api.get('/consent/records').then((res) => setRecords(res.data.records || [])).catch(() => {});
  };
  useEffect(load, [branchId]);

  useEffect(() => {
    if (assign.q.trim().length < 2) {
      setPatients([]);
      return;
    }
    const t = setTimeout(() => {
      api.get('/patients', { params: { search: assign.q, limit: 8 } }).then((res) => setPatients(res.data.patients || [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [assign.q, branchId]);

  const saveTpl = async (e) => {
    e.preventDefault();
    try {
      await api.post('/consent/templates', form);
      toast.success('Template created.');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    }
  };

  const doAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/consent/records', assign);
      toast.success('Consent assigned.');
      setAssignOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed.');
    }
  };

  const draw = (e) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const rect = c.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1c2430';
    ctx.lineTo(pt.clientX - rect.left, pt.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pt.clientX - rect.left, pt.clientY - rect.top);
  };

  const submitSign = async (status) => {
    const signatureDataUrl = canvasRef.current?.toDataURL?.() || '';
    try {
      await api.post(`/consent/records/${sign._id}/sign`, { status, signatureDataUrl, signerName: sign.patientId?.name });
      toast.success(status === 'accepted' ? 'Consent accepted.' : 'Consent rejected.');
      setSign(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign failed.');
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Consent forms"
        actions={
          <div className="flex flex-wrap gap-2">
            {can(user, P.CONSENT_CAPTURE) && <button type="button" className="btn-secondary" onClick={() => setAssignOpen(true)}>Assign to patient</button>}
            {can(user, P.CONSENT_TEMPLATES) && <button type="button" className="btn-primary" onClick={() => setOpen(true)}>New template</button>}
          </div>
        }
      />
      <h3 className="text-sm font-semibold mb-2">Templates</h3>
      {!templates.length ? <EmptyState title="No templates" /> : (
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {templates.map((t) => (
            <div key={t._id} className="card">
              <p className="font-semibold">{t.name}</p>
              <p className="text-xs text-ink-faint">v{t.version} · {t.category}</p>
            </div>
          ))}
        </div>
      )}
      <h3 className="text-sm font-semibold mb-2">Records</h3>
      {!records.length ? <EmptyState title="No consent records" /> : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r._id} className="card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-medium">{r.titleSnapshot}</p>
                <p className="text-sm text-ink-muted">{r.patientId?.name} · v{r.version}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge value={r.status} />
                {r.status === 'pending' && <button type="button" className="btn-primary !min-h-9" onClick={() => setSign(r)}>Capture</button>}
                <Link className="btn-ghost !min-h-9 text-xs" to={ROUTES.print('consent', r._id)} target="_blank" rel="noreferrer">Print</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} title="Consent template" onClose={() => setOpen(false)} wide>
        <form onSubmit={saveTpl} className="space-y-3">
          <input className="input-field" required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {['general', 'procedure', 'therapy', 'privacy', 'treatment', 'other'].map((c) => <option key={c}>{c}</option>)}
          </select>
          <textarea className="input-field" rows={8} required placeholder="Consent text" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <button type="submit" className="btn-primary w-full">Save</button>
        </form>
      </Modal>

      <Modal open={assignOpen} title="Assign consent" onClose={() => setAssignOpen(false)}>
        <form onSubmit={doAssign} className="space-y-3">
          <select className="input-field" required value={assign.consentTemplateId} onChange={(e) => setAssign({ ...assign, consentTemplateId: e.target.value })}>
            <option value="">Template</option>
            {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <input className="input-field" placeholder="Search patient" value={assign.q} onChange={(e) => setAssign({ ...assign, q: e.target.value })} />
          <div className="max-h-40 overflow-y-auto">
            {patients.map((p) => (
              <button type="button" key={p._id} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${assign.patientId === p._id ? 'bg-[#f3efe8]' : ''}`} onClick={() => setAssign({ ...assign, patientId: p._id, q: p.name })}>
                {p.name}
              </button>
            ))}
          </div>
          <button type="submit" className="btn-primary w-full">Assign</button>
        </form>
      </Modal>

      <Modal open={!!sign} title="Patient consent" onClose={() => setSign(null)} wide>
        {sign && (
          <div className="space-y-3">
            <p className="font-semibold">{sign.titleSnapshot}</p>
            <div className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto border border-line rounded-lg p-3">{sign.bodySnapshot}</div>
            <p className="text-xs text-ink-muted">Sign below</p>
            <canvas
              ref={canvasRef}
              width={480}
              height={160}
              className="w-full border border-line rounded-lg bg-white touch-none"
              onMouseDown={() => canvasRef.current?.getContext('2d').beginPath()}
              onMouseMove={(e) => e.buttons === 1 && draw(e)}
              onTouchMove={draw}
            />
            <div className="flex gap-2">
              <button type="button" className="btn-primary flex-1" onClick={() => submitSign('accepted')}>Accept</button>
              <button type="button" className="btn-danger flex-1" onClick={() => submitSign('rejected')}>Reject</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
