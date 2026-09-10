import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath, isPathAllowedForRole } from '../constants/routes';

export function useAuthRedirect() {
  const location = useLocation();
  const { user } = useAuth();

  return (role, authUser = user) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const from = location.state?.from?.pathname;
    const path =
      from && isPathAllowedForRole(from, role, authUser)
        ? from
        : getDashboardPath(role, authUser);

    window.location.assign(path);
  };
}
