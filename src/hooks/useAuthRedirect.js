import { useLocation } from 'react-router-dom';
import { getDashboardPath, isPathAllowedForRole } from '../constants/routes';

export function useAuthRedirect() {
  const location = useLocation();

  return (role) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const from = location.state?.from?.pathname;
    const path =
      from && isPathAllowedForRole(from, role) ? from : getDashboardPath(role);

    // Full page load resets iOS Safari zoom after input focus
    window.location.assign(path);
  };
}
