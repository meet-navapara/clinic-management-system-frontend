import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Money from '../components/ui/Money';
import { useBranch } from '../context/BranchContext';

export default function RevenuePage() {
  const { branchId } = useBranch();
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    setSummary(null);
    api.get('/billing/revenue')
      .then((res) => setSummary(res.data.summary))
      .catch((err) => toast.error(err.response?.data?.message || 'Not authorized or failed to load revenue.'));
  }, [branchId]);

  if (!summary) return <div className="page-container">Loading…</div>;

  return (
    <div className="page-container">
      <PageHeader title="Revenue" description="From recorded invoice payments — one financial source of truth." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Collected" value={<Money value={summary.collected} />} />
        <StatCard label="Payments" value={summary.paymentCount} />
        <StatCard label="Outstanding" value={<Money value={summary.outstanding} />} />
        <StatCard label="Open invoices" value={summary.outstandingCount} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <p className="section-label mb-3">By method</p>
          {(summary.byMethod || []).map((m) => (
            <div key={m._id} className="flex justify-between text-sm py-1">
              <span className="capitalize">{m._id?.replace('_', ' ')}</span>
              <Money value={m.amount} />
            </div>
          ))}
        </div>
        <div className="card">
          <p className="section-label mb-3">By doctor</p>
          {(summary.byDoctor || []).map((d) => (
            <div key={d._id || d.doctorName} className="flex justify-between text-sm py-1">
              <span>{d.doctorName}</span>
              <Money value={d.paid} />
            </div>
          ))}
        </div>
        {(summary.byBranch || []).length > 0 && (
          <div className="card lg:col-span-2">
            <p className="section-label mb-3">By branch</p>
            {(summary.byBranch || []).map((b) => (
              <div key={b._id || b.branchName} className="flex justify-between text-sm py-1">
                <span>{b.branchName || 'Unassigned'}</span>
                <Money value={b.paid} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
