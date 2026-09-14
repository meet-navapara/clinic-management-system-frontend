import { AlertCircle, CheckCircle, Clock, UserX, XCircle } from 'lucide-react';

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
];

export const ACTIVE_APPOINTMENT_STATUSES = ['scheduled', 'confirmed'];

export const appointmentStatusConfig = {
  scheduled: {
    label: 'Scheduled',
    badge: 'bg-[#f8f1de] text-[#7a5d16] ring-[#d4af37]/30',
    calendar: 'bg-[#fdf6e3] border-[#d4af37]/50 text-[#876719]',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    badge: 'bg-[#eef3f8] text-[#2c4a63] ring-[#c5d4e0]/80',
    calendar: 'bg-[#eef6ff] border-blue-200 text-[#1d4f91]',
    icon: CheckCircle,
    gradient: 'from-[#eef6ff] to-[#f0f7ff]',
    iconBg: 'bg-blue-100/80',
    iconColor: 'text-blue-700',
    valueColor: 'text-blue-700',
    actionClass: 'bg-[#1d4f91] text-white hover:bg-[#163d72]',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-[#eef6f1] text-[#2d5a40] ring-[#c5ddd0]/80',
    calendar: 'bg-[#edf8f0] border-green-200 text-[#1f6b3f]',
    icon: CheckCircle,
    gradient: 'from-[#f0faf4] to-[#edf8f0]',
    iconBg: 'bg-green-100/80',
    iconColor: 'text-green-700',
    valueColor: 'text-green-700',
    actionClass: 'bg-[#1f6b3f] text-white hover:bg-[#185a34]',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-[#f8eeee] text-[#8a3a32] ring-[#e4c9c6]/80',
    calendar: 'bg-[#fef2f2] border-red-200 text-[#b42318]',
    icon: XCircle,
    gradient: 'from-[#fef2f2] to-[#fff5f5]',
    iconBg: 'bg-red-100/80',
    iconColor: 'text-red-700',
    valueColor: 'text-[#b42318]',
  },
  no_show: {
    label: "Didn't arrive",
    badge: 'bg-[#f3f3f4] text-[#52525b] ring-[#d4d4d8]/80',
    calendar: 'bg-[#f4f4f5] border-zinc-200 text-[#52525b]',
    icon: UserX,
  },
  // Legacy alias
  pending: {
    label: 'Scheduled',
    badge: 'bg-[#f8f1de] text-[#7a5d16] ring-[#d4af37]/30',
    calendar: 'bg-[#fdf6e3] border-[#d4af37]/50 text-[#876719]',
    icon: AlertCircle,
  },
};

export const defaultAppointmentStatus = {
  label: 'Unknown',
  badge: 'bg-gray-100 text-gray-700 ring-gray-200',
  calendar: 'bg-gray-50 border-gray-200 text-gray-600',
  icon: AlertCircle,
};

export function getAppointmentStatusConfig(status) {
  return appointmentStatusConfig[status] ?? defaultAppointmentStatus;
}

export function normalizeAppointmentStatus(status) {
  return status === 'pending' ? 'scheduled' : status;
}
