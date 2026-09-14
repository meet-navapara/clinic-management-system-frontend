import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function canGoBackInApp() {
  const idx = window.history.state?.idx;
  if (typeof idx === 'number') return idx > 0;
  return window.history.length > 1;
}

export default function BackButton({ to, label = 'Back', className = '', variant = 'default' }) {
  const navigate = useNavigate();
  const onDark = variant === 'onDark';

  const goBack = () => {
    if (canGoBackInApp()) {
      navigate(-1);
      return;
    }
    if (typeof to === 'string' && to) {
      navigate(to);
      return;
    }
    if (window.opener) {
      window.close();
      return;
    }
    navigate('/');
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className={`inline-flex items-center justify-center gap-1.5 min-h-10 min-w-10 px-2 rounded-lg text-sm font-medium transition-colors ${
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
