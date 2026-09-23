import { useEffect, useMemo, useState } from 'react';
import { Banknote, CreditCard, Smartphone, Wallet } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Money from '../components/ui/Money';
import { useBranch } from '../context/BranchContext';
import SkeletonPage from '../components/ui/Skeleton';
import { fillMethodBreakdown, paymentMethodLabel } from '../constants/payments';
import ComingSoonPage from '../components/ui/ComingSoonPage';
import { REVENUE_COMING_SOON } from '../constants/featureFlags';

const METHOD_ICON = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
  bank_transfer: Wallet,
  online: Wallet,
  other: Wallet,
};

export default function RevenuePage() {
  const { branchId, current } = useBranch();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (REVENUE_COMING_SOON) {
      setLoading(false);
      return undefined;
    }
    setSummary(null);
    setLoading(true);
    api
      .get('/billing/revenue')
      .then((res) => setSummary(res.data.summary))
      .catch((err) => toast.error(err.response?.data?.message || 'Not authorized or failed to load revenue.'))
      .finally(() => setLoading(false));
  }, [branchId]);

  const methods = useMemo(() => fillMethodBreakdown(summary?.byMethod || []), [summary]);

  const maxMethod = useMemo(
    () => Math.max(1, ...methods.map((m) => m.amount)),
    [methods]
  );

  if (REVENUE_COMING_SOON) {
    return (
      <ComingSoonPage
        title="Revenue"
        description="Collections and payment breakdowns will open here soon. Reporting code stays ready."
      />
    );
  }

  if (loading) return <SkeletonPage cards={4} rows={6} />;
  if (!summary) {
    return (
      <div className="page-container">
        <h1 className="page-title">Revenue</h1>
        <p className="mt-2 text-sm text-ink-muted">Could not load revenue data.</p>
      </div>
    );
  }

  const highlight = methods.filter((m) => ['cash', 'upi', 'card'].includes(m.id));

  return (
    <div className="page-container">
      <section className="relative overflow-hidden rounded-[22px] mb-5 border border-[#e4e0d8] bg-gradient-to-br from-[#1c2430] via-[#243040] to-[#3d5a80] text-white shadow-[0_20px_50px_-28px_rgba(28,36,48,0.65)]">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#c9a227]/25 blur-3xl"
          aria-hidden
        />
        <div className="relative p-5 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Revenue · all recorded payments
          </p>
          <h1 className="mt-2 text-[32px] sm:text-[40px] font-semibold tracking-tight leading-none">
            Collections
          </h1>
          <p className="mt-2 text-sm text-white/70 max-w-md">
            {current?.name
              ? `${current.name} · net of refunds`
              : 'All branches · net of refunds'}
          </p>

          <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Net collected', value: <Money value={summary.collected} className="text-white" /> },
              { label: 'Payments', value: summary.paymentCount },
              {
                label: 'Outstanding',
                value: <Money value={summary.outstanding} className="text-[#f0d78c]" />,
                accent: true,
              },
              { label: 'Open invoices', value: summary.outstandingCount },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3.5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">{s.label}</p>
                <p className="mt-2 text-[24px] font-semibold tabular-nums tracking-tight leading-none text-white">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {highlight.map((m, idx) => {
              const Icon = METHOD_ICON[m.id] || Wallet;
              return (
                <div
                  key={m.id}
                  className="rounded-[16px] border border-white/10 bg-white/5 px-4 py-3.5"
                  style={{ animation: `fadeIn 0.45s ease ${idx * 80}ms both` }}
                >
                  <div className="flex items-center gap-2 text-white/65">
                    <Icon className="w-4 h-4" />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">{m.short}</span>
                  </div>
                  <p className="mt-2 text-[26px] font-semibold tabular-nums tracking-tight leading-none">
                    <Money value={m.amount} className="text-white" />
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {m.count} payment{m.count === 1 ? '' : 's'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-[18px] border border-[#e7e2d8] bg-white p-5 shadow-[0_12px_40px_-28px_rgba(28,36,48,0.35)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint mb-4">
            By payment method
          </p>
          <div className="space-y-4">
            {methods.map((m) => {
              const Icon = METHOD_ICON[m.id] || Wallet;
              const pct = Math.round((m.amount / maxMethod) * 100);
              return (
                <div key={m.id}>
                  <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
                    <span className="inline-flex items-center gap-2 font-medium text-ink">
                      <Icon className="w-4 h-4 text-ink-muted" />
                      {m.label}
                    </span>
                    <span className="tabular-nums font-semibold">
                      <Money value={m.amount} />
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f0ebe3] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1c2430] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {m.count} payment{m.count === 1 ? '' : 's'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[18px] border border-[#e7e2d8] bg-white p-5 shadow-[0_12px_40px_-28px_rgba(28,36,48,0.35)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint mb-4">By doctor</p>
          {!(summary.byDoctor || []).length ? (
            <p className="text-sm text-ink-muted">No billed invoices yet.</p>
          ) : (
            <ul className="space-y-3">
              {(summary.byDoctor || []).map((d) => (
                <li
                  key={d._id || d.doctorName}
                  className="flex items-center justify-between gap-3 rounded-[14px] border border-[#eee9df] bg-[#fbfaf7] px-3.5 py-3"
                >
                  <div>
                    <p className="font-medium text-ink">{d.doctorName}</p>
                    <p className="text-xs text-ink-faint">
                      Billed <Money value={d.billed} />
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">
                    <Money value={d.paid} />
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {(summary.byBranch || []).length > 0 && (
          <div className="lg:col-span-2 rounded-[18px] border border-[#e7e2d8] bg-white p-5 shadow-[0_12px_40px_-28px_rgba(28,36,48,0.35)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint mb-4">By branch</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(summary.byBranch || []).map((b) => (
                <div
                  key={b._id || b.branchName}
                  className="rounded-[14px] border border-[#eee9df] bg-[#fbfaf7] px-4 py-3.5"
                >
                  <p className="font-medium text-ink">{b.branchName || 'Unassigned'}</p>
                  <p className="mt-2 text-[22px] font-semibold tabular-nums tracking-tight">
                    <Money value={b.paid} />
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    Billed <Money value={b.billed} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-ink-faint">
        Method totals are net (completed payments minus refunds). Labels:{' '}
        {['cash', 'upi', 'card'].map((id) => paymentMethodLabel(id)).join(', ')}, and more.
      </p>
    </div>
  );
}
