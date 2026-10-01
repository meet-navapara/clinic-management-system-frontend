import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath, isPathAllowedForRole } from '../constants/routes';

export function useAuthRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
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

    // Soft navigate — avoid full reload (which re-shows auth loader + remounts the page).
    navigate(path, { replace: true });
  };
}
