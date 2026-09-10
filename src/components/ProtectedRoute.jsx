import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath, ROUTES } from '../constants/routes';
import AuthLoadingScreen from './AuthLoadingScreen';

export default function ProtectedRoute({ children, allowedRoles, requireApprovedDoctor = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role, user)} replace />;
  }

  if (
    requireApprovedDoctor &&
    user.role === 'doctor' &&
    user.approvalStatus !== 'approved'
  ) {
    return <Navigate to={ROUTES.doctorPending} replace />;
  }

  return children;
}
