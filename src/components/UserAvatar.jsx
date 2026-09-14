import { User } from 'lucide-react';

const ROLE_STYLES = {
  doctor: {
    avatarRing: 'ring-[#d4af37]/60',
    avatarBg: 'bg-gradient-to-br from-[#2a2420] to-[#3d3530]',
  },
  admin: {
    avatarRing: 'ring-[#d4af37]/40',
    avatarBg: 'bg-gradient-to-br from-[#a8841f] to-[#876719]',
  },
};

const SIZE_CLASSES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-base',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-16 w-16 text-2xl',
};

export const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export default function UserAvatar({
  name = '',
  profilePhoto = '',
  role = 'doctor',
  size = 'md',
  rounded = 'full',
  className = '',
}) {
  const roleKey =
    role === 'super_admin' || role === 'admin' ? 'admin' : 'doctor';
  const roleStyle = ROLE_STYLES[roleKey];
  const roundedClass = rounded === 'xl' ? 'rounded-xl' : 'rounded-full';

  return (
    <div
      className={`${SIZE_CLASSES[size]} ${roundedClass} overflow-hidden ring-2 ${roleStyle.avatarRing} shrink-0 ${className}`}
    >
      {profilePhoto ? (
        <img src={profilePhoto} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-bold text-white ${roleStyle.avatarBg}`}
        >
          {getInitials(name) || <User className="h-4 w-4" />}
        </div>
      )}
    </div>
  );
}
