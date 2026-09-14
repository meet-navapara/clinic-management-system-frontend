import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Dropdown from '../components/ui/Dropdown';

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
  const field = (k, label, { ta = false, span = '' } = {}) => (
    <div key={k} className={span}>
      <label className="label-field">{label}</label>
      {ta ? (
        <textarea className="input-field" rows={3} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      ) : (
        <input className="input-field" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      )}
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader title="Print settings" description="Used on invoices, receipts, prescriptions and consent forms." />
      <form onSubmit={save} className="card grid sm:grid-cols-2 gap-3">
        {field('clinicName', 'Clinic name')}
        {field('phone', 'Phone')}
        {field('email', 'Email')}
        {field('website', 'Website')}
        {field('address', 'Address', { ta: true, span: 'sm:col-span-2' })}
        {field('registrationNumber', 'Registration number')}
        {field('gstNumber', 'GST / tax number')}
        {field('taxLabel', 'Tax label')}
        {field('headerText', 'Header text', { span: 'sm:col-span-2' })}
        {field('footerText', 'Footer text', { span: 'sm:col-span-2' })}
        {field('terms', 'Terms', { ta: true, span: 'sm:col-span-2' })}
        {field('logo', 'Logo URL or data URI', { ta: true, span: 'sm:col-span-2' })}
        <div className="sm:col-span-2">
          <label className="label-field">Paper</label>
          <Dropdown
            className="max-w-xs"
            value={form.paperSize || 'A4'}
            onChange={(paperSize) => setForm({ ...form, paperSize })}
            ariaLabel="Paper"
            options={[
              { value: 'A4', label: 'A4' },
              { value: 'A5', label: 'A5' },
              { value: 'receipt', label: 'Receipt' },
            ]}
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}
