import Loader from '../Loader';

/**
 * Lightweight blocking overlay for saves / destructive actions.
 * Place inside a `relative` container (or uses fixed full-viewport when `fullscreen`).
 */
export default function LoadingOverlay({
  show = false,
  message = 'Please wait…',
  fullscreen = false,
}) {
  if (!show) return null;

  return (
    <div
      className={`${
        fullscreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-20 rounded-[inherit]'
      } flex flex-col items-center justify-center bg-[#f6f4f0]/75 backdrop-blur-[2px]`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader size="md" />
      {message ? (
        <p className="mt-3 text-xs sm:text-sm font-medium text-ink-muted px-4 text-center">{message}</p>
      ) : null}
    </div>
  );
}
