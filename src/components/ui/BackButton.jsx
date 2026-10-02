import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPageMeta, getParentPath, getDashboardPath, ROUTES } from '../../constants/routes';
import { canGoBackInApp, peekPreviousPath, popNavStack } from '../NavigationTracker';

export { canGoBackInApp } from '../NavigationTracker';

/**
 * Page back control (not for the top nav).
 * Prefers one-step history; falls back to parent page, then dashboard.
 */
export default function BackButton({
  to,
  label = 'Back',
  className = '',
  variant = 'page',
}) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const onDark = variant === 'onDark';
  const meta = getPageMeta(pathname);
  const currentKey = `${pathname}${search || ''}`;
  const trackedPrev = peekPreviousPath();
  const parentPath =
    (typeof to === 'string' && to) ||
    (typeof meta.backTo === 'string' && meta.backTo) ||
    getParentPath(pathname, user);

  const hasHistory = canGoBackInApp() || Boolean(trackedPrev && trackedPrev !== currentKey);
  const isRoot = Boolean(meta.isRoot);
  const disabled = !hasHistory && isRoot;

  const goBack = () => {
    if (disabled) return;

    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }

    if (canGoBackInApp()) {
      navigate(-1);
      return;
    }

    if (trackedPrev && trackedPrev !== currentKey) {
      popNavStack();
      navigate(trackedPrev);
      return;
    }

    if (parentPath && parentPath !== pathname) {
      navigate(parentPath);
      return;
    }

    navigate(user ? getDashboardPath(user.role, user) : ROUTES.home);
  };

  const baseClass = onDark
    ? 'inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white disabled:opacity-30'
    : 'inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink disabled:opacity-40';

  return (
    <button
      type="button"
      onClick={goBack}
      disabled={disabled}
      aria-label={label}
      className={`${baseClass} transition-colors disabled:pointer-events-none ${className}`.trim()}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
