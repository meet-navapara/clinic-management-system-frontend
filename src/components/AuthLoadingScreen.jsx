import Loader from './Loader';

/** Full-viewport loading used while auth session is resolving / redirecting. */
export default function AuthLoadingScreen({ message = 'Please wait…' }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f6f4f0]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader size="lg" />
      {message ? (
        <p className="mt-4 text-sm font-medium text-ink-muted tracking-wide px-4 text-center">
          {message}
        </p>
      ) : null}
    </div>
  );
}
