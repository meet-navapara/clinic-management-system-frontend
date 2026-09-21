import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath, ROUTES } from '../constants/routes';
import { can, isStaffUser } from '../constants/permissions';
import AuthLoadingScreen from './AuthLoadingScreen';

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireApprovedDoctor = false,
  permission,
  anyPermission,
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading && !user) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  const roleOk = allowedRoles
    ? allowedRoles.includes(user.role) || (allowedRoles.includes('staff') && isStaffUser(user))
    : true;
  if (!roleOk) {
    return <Navigate to={getDashboardPath(user.role, user)} replace />;
  }

  if (
    requireApprovedDoctor &&
    user.role === 'doctor' &&
    user.approvalStatus !== 'approved'
  ) {
    return <Navigate to={ROUTES.doctorPending} replace />;
  }

  if (permission && !can(user, permission)) {
    toast.error('You do not have access to this page.', { id: 'permission-denied' });
    return <Navigate to={getDashboardPath(user.role, user)} replace />;
  }
  if (anyPermission?.length && !anyPermission.some((p) => can(user, p))) {
    toast.error('You do not have access to this page.', { id: 'permission-denied' });
    return <Navigate to={getDashboardPath(user.role, user)} replace />;
  }

  return children;
}
