import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath, ROUTES } from '../../constants/routes';

function canGoBackInApp() {
  const idx = window.history.state?.idx;
  if (typeof idx === 'number') return idx > 0;
  return false;
}

export default function BackButton({ to, label = 'Back', className = '', variant = 'default' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const onDark = variant === 'onDark';

  const fallbackPath = () => {
    if (typeof to === 'string' && to) return to;
    if (user) return getDashboardPath(user.role, user);
    return ROUTES.home;
  };

  const goBack = () => {
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }
    if (canGoBackInApp()) {
      navigate(-1);
      return;
    }
    navigate(fallbackPath());
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className={`inline-flex items-center justify-center gap-1.5 min-h-9 min-w-9 sm:min-h-10 sm:min-w-10 px-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
        onDark
          ? 'text-white/80 hover:text-white hover:bg-white/10'
          : 'text-ink-muted hover:text-ink hover:bg-white'
      } ${className}`.trim()}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
