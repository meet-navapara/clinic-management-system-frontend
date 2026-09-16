import {
  getAppointmentStatusConfig,
  normalizeAppointmentStatus,
} from '../../constants/appointmentStatus';

export default function StatusBadge({ status, className = '' }) {
  const config = getAppointmentStatusConfig(normalizeAppointmentStatus(status));
  return (
    <span className={`status-badge ${config.badge} ${className}`}>{config.label}</span>
  );
}

export function ApprovalBadge({ status, className = '' }) {
  const map = {
    pending: 'bg-[#f8f1de] text-[#7a5d16] ring-[#d4af37]/30',
    approved: 'bg-[#eef6f1] text-[#2d5a40] ring-[#c5ddd0]/80',
    rejected: 'bg-[#f8eeee] text-[#8a3a32] ring-[#e4c9c6]/80',
    suspended: 'bg-[#f3f3f4] text-[#52525b] ring-[#d4d4d8]/80',
    inactive: 'bg-[#f3f3f4] text-[#52525b] ring-[#d4d4d8]/80',
  };
  const labels = {
    inactive: 'Disabled',
    suspended: 'Suspended',
  };
  return (
    <span className={`status-badge capitalize ${map[status] || map.pending} ${className}`.trim()}>
      {labels[status] || status || 'pending'}
    </span>
  );
}
