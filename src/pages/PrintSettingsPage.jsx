import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';

export default function PrintSettingsPage() {
  const [form, setForm] = useState(null);
  useEffect(() => {
    api.get('/ops/print/settings').then((res) => setForm(res.data.settings || {})).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put('/ops/print/settings', form);
      toast.success('Print settings saved. Documents use clinic branding — nothing is hard-coded.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    }
  };

  if (!form) return <div className="page-container">Loading…</div>;
  const field = (k, label, ta) => (
    <div key={k}>
      <label className="label-field">{label}</label>
      {ta ? (
        <textarea className="input-field" rows={3} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      ) : (
        <input className="input-field" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      )}
    </div>
  );

  return (
    <div className="page-container max-w-2xl">
      <PageHeader title="Print settings" description="Used on invoices, receipts, prescriptions and consent forms." />
      <form onSubmit={save} className="card space-y-3">
        {field('clinicName', 'Clinic name')}
        {field('address', 'Address', true)}
        {field('phone', 'Phone')}
        {field('email', 'Email')}
        {field('website', 'Website')}
        {field('registrationNumber', 'Registration number')}
        {field('gstNumber', 'GST / tax number')}
        {field('taxLabel', 'Tax label')}
        {field('headerText', 'Header text')}
        {field('footerText', 'Footer text')}
        {field('terms', 'Terms', true)}
        {field('logo', 'Logo URL or data URI', true)}
        <label className="label-field">Paper</label>
        <select className="input-field" value={form.paperSize || 'A4'} onChange={(e) => setForm({ ...form, paperSize: e.target.value })}>
          <option>A4</option>
          <option>A5</option>
          <option value="receipt">Receipt</option>
        </select>
        <button type="submit" className="btn-primary">Save</button>
      </form>
    </div>
  );
}
