import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const appointmentStatusConfig = {
  pending: {
    badge: 'bg-[#fdf6e3] text-[#876719] ring-[#d4af37]/35',
    icon: AlertCircle,
  },
  confirmed: {
    badge: 'bg-[#eef6ff] text-[#1d4f91] ring-blue-200/60',
    icon: CheckCircle,
    gradient: 'from-[#eef6ff] to-[#f0f7ff]',
    iconBg: 'bg-blue-100/80',
    iconColor: 'text-blue-700',
    valueColor: 'text-blue-700',
    actionClass: 'bg-[#1d4f91] text-white hover:bg-[#163d72]',
  },
  completed: {
    badge: 'bg-[#edf8f0] text-[#1f6b3f] ring-green-200/60',
    icon: CheckCircle,
    gradient: 'from-[#f0faf4] to-[#edf8f0]',
    iconBg: 'bg-green-100/80',
    iconColor: 'text-green-700',
    valueColor: 'text-green-700',
    actionClass: 'bg-[#1f6b3f] text-white hover:bg-[#185a34]',
  },
  cancelled: {
    badge: 'bg-[#fef2f2] text-[#b42318] ring-red-200/60',
    icon: XCircle,
    gradient: 'from-[#fef2f2] to-[#fff5f5]',
    iconBg: 'bg-red-100/80',
    iconColor: 'text-red-700',
    valueColor: 'text-[#b42318]',
  },
};

export const defaultAppointmentStatus = {
  badge: 'bg-gray-100 text-gray-700 ring-gray-200',
  icon: AlertCircle,
};
