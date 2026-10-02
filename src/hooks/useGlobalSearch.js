import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { useBranch } from '../context/BranchContext';
import { SEARCH_SECTIONS, countSearchResults } from '../utils/globalSearch';

export default function useGlobalSearch({ enabled = true, debounceMs = 250, initialQuery = '' } = {}) {
  const { branchId } = useBranch();
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState({});
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);
  const [error, setError] = useState('');

  const trimmed = q.trim();
  const idle = trimmed.length < 2;

  const run = useCallback((query) => {
    const value = String(query ?? '').trim();
    if (value.length < 2) {
      setResults({});
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    api
      .get('/ops/search', { params: { q: value } })
      .then((res) => setResults(res.data.results || {}))
      .catch((err) => {
        setResults({});
        setError(err.response?.data?.message || 'Search failed.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!enabled || !idle) return undefined;
    let cancelled = false;
    setRecentLoading(true);
    api
      .get('/patients', {
        params: { page: 1, limit: 5 },
        skipCache: true,
        skipErrorToast: true,
      })
      .then((res) => {
        if (!cancelled) setRecentPatients(res.data.patients || []);
      })
      .catch(() => {
        if (!cancelled) setRecentPatients([]);
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, idle, branchId]);

  useEffect(() => {
    if (!enabled) return undefined;
    const handle = setTimeout(() => run(q), debounceMs);
    return () => clearTimeout(handle);
  }, [enabled, q, branchId, debounceMs, run]);

  const total = useMemo(() => countSearchResults(results), [results]);

  return {
    q,
    setQ,
    results,
    recentPatients,
    loading,
    recentLoading,
    error,
    trimmed,
    idle,
    total,
    run,
    sections: SEARCH_SECTIONS,
  };
}
