import { can } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';

export default function PermissionGate({ permission, children, fallback = null }) {
  const { user } = useAuth();
  if (!can(user, permission)) return fallback;
  return children;
}
