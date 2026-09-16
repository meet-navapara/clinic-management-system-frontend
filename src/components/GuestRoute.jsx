import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../constants/routes';
import AuthLoadingScreen from './AuthLoadingScreen';

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Navigate to={getDashboardPath(user.role, user)} replace />;
  }

  return children;
}
