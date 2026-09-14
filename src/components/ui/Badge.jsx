const LABELS = {
  no_show: "Didn't arrive",
  in_consultation: 'In consultation',
  partially_paid: 'Partially paid',
};

const MAP = {
  paid: 'bg-[#eef6f1] text-[#2d5a40] ring-[#c5ddd0]/80',
  unpaid: 'bg-[#f8f1de] text-[#7a5d16] ring-[#d4af37]/30',
  partially_paid: 'bg-[#eef3f8] text-[#2c4a63] ring-[#c5d4e0]/80',
  refunded: 'bg-[#f3f3f4] text-[#52525b] ring-[#d4d4d8]/80',
  cancelled: 'bg-[#f8eeee] text-[#8a3a32] ring-[#e4c9c6]/80',
  waiting: 'bg-[#f8f1de] text-[#7a5d16] ring-[#d4af37]/30',
  called: 'bg-[#eef3f8] text-[#2c4a63] ring-[#c5d4e0]/80',
  in_consultation: 'bg-[#eef6f1] text-[#2d5a40] ring-[#c5ddd0]/80',
  completed: 'bg-[#eef6f1] text-[#2d5a40] ring-[#c5ddd0]/80',
  active: 'bg-[#eef6f1] text-[#2d5a40] ring-[#c5ddd0]/80',
  inactive: 'bg-[#f3f3f4] text-[#52525b] ring-[#d4d4d8]/80',
  suspended: 'bg-[#f8eeee] text-[#8a3a32] ring-[#e4c9c6]/80',
  draft: 'bg-[#f3f3f4] text-[#52525b] ring-[#d4d4d8]/80',
  scheduled: 'bg-[#eef3f8] text-[#2c4a63] ring-[#c5d4e0]/80',
  processing: 'bg-[#f8f1de] text-[#7a5d16] ring-[#d4af37]/30',
  failed: 'bg-[#f8eeee] text-[#8a3a32] ring-[#e4c9c6]/80',
  accepted: 'bg-[#eef6f1] text-[#2d5a40] ring-[#c5ddd0]/80',
  rejected: 'bg-[#f8eeee] text-[#8a3a32] ring-[#e4c9c6]/80',
  pending: 'bg-[#f8f1de] text-[#7a5d16] ring-[#d4af37]/30',
  no_show: 'bg-[#f3f3f4] text-[#52525b] ring-[#d4d4d8]/80',
};

export default function Badge({ value, className = '' }) {
  const key = String(value || '').toLowerCase();
  const cls = MAP[key] || 'bg-[#f3f3f4] text-[#52525b] ring-[#d4d4d8]/80';
  const label = LABELS[key] || String(value || '—').replace(/_/g, ' ');
  return <span className={`status-badge capitalize ${cls} ${className}`}>{label}</span>;
}
