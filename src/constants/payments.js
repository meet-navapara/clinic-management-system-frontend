/** Payment method catalog — keep aligned with backend Payment.PAYMENT_METHODS */
export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', short: 'Cash' },
  { id: 'upi', label: 'UPI', short: 'UPI' },
  { id: 'card', label: 'Card', short: 'Card' },
  { id: 'bank_transfer', label: 'Bank transfer', short: 'Bank' },
  { id: 'online', label: 'Online', short: 'Online' },
  { id: 'other', label: 'Other', short: 'Other' },
];

export const PAYMENT_METHOD_IDS = PAYMENT_METHODS.map((m) => m.id);

export function paymentMethodLabel(id) {
  const found = PAYMENT_METHODS.find((m) => m.id === id);
  return found?.label || String(id || '—').replace(/_/g, ' ');
}

/** Normalize API byMethod rows into a full ordered list (₹0 for missing). */
export function fillMethodBreakdown(rows = []) {
  const map = Object.fromEntries(
    (rows || []).map((r) => [
      r._id || r.method || r.id,
      {
        amount: Number(r.amount) || 0,
        count: Number(r.count) || 0,
      },
    ])
  );
  return PAYMENT_METHODS.map((m) => ({
    id: m.id,
    label: m.label,
    short: m.short,
    amount: round2(map[m.id]?.amount || 0),
    count: map[m.id]?.count || 0,
  }));
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
