import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/ui/BackButton';
import { ROUTES } from '../constants/routes';
import { Skeleton } from '../components/ui/Skeleton';

export default function QueueDisplay() {
  const { user } = useAuth();
  const { current, branchId } = useBranch();
  const [display, setDisplay] = useState(null);
  const [loading, setLoading] = useState(true);
  const needsBranch = user?.role === 'doctor' && !branchId;

  useEffect(() => {
    if (needsBranch) {
      setDisplay(null);
      setLoading(false);
      return undefined;
    }
    let first = true;
    const load = () => {
      api
        .get('/queue/display')
        .then((res) => setDisplay(res.data.display))
        .catch(() => {})
        .finally(() => {
          if (first) {
            setLoading(false);
            first = false;
          }
        });
    };
    setLoading(true);
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [branchId, needsBranch]);

  if (needsBranch) {
    return (
      <div className="min-h-dvh bg-ink text-white flex flex-col items-center justify-center px-6 text-center relative">
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <BackButton to={ROUTES.queue} variant="onDark" />
        </div>
        <p className="uppercase tracking-[0.3em] text-accent-400 text-sm mb-4">Queue display</p>
        <p className="text-2xl sm:text-3xl font-semibold max-w-md">Select a branch in the app header first</p>
        <p className="mt-4 text-white/60 max-w-sm">TV display shows one branch queue at a time.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="min-h-dvh bg-ink text-white flex flex-col items-center justify-center px-6 text-center relative"
        role="status"
        aria-label="Loading"
        aria-busy="true"
      >
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <BackButton to={ROUTES.queue} variant="onDark" />
        </div>
        <Skeleton className="h-3 w-32 bg-white/20 mb-6" />
        <Skeleton className="h-16 sm:h-24 w-64 max-w-full bg-white/15 rounded-lg" />
        <Skeleton className="h-6 w-48 max-w-full bg-white/10 mt-6" />
      </div>
    );
  }

  const now = display?.nowServing;

  return (
    <div className="min-h-dvh bg-ink text-white flex flex-col items-center justify-center px-6 text-center relative">
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
        <BackButton to={ROUTES.queue} variant="onDark" />
      </div>
      <p className="uppercase tracking-[0.3em] text-accent-400 text-sm mb-4">
        {display?.title || current?.displayTitle || current?.name || 'Now serving'}
      </p>
      <p className="text-6xl sm:text-8xl font-semibold tabular-nums">
        {now ? `TOKEN #${now.tokenLabel}` : '—'}
      </p>
      {now?.roomLabel && (
        <p className="mt-6 text-xl sm:text-2xl text-white/80">Please proceed to {now.roomLabel}</p>
      )}
      {!!display?.waiting?.length && (
        <div className="mt-12">
          <p className="section-label !text-white/50 mb-3">Up next</p>
          <div className="flex flex-wrap justify-center gap-3">
            {display.waiting.map((t) => (
              <span key={t.tokenNumber} className="px-4 py-2 rounded-lg bg-white/10 text-lg">
                #{t.tokenLabel}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
