import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import api, { setBranchHeader } from '../utils/api';
import { useAuth } from './AuthContext';
import { can, isStaffUser, P } from '../constants/permissions';

const BranchContext = createContext(null);
const STORAGE_KEY = 'branchId';

function staffPrimaryBranchId(user) {
  if (!user) return '';
  const def = user.defaultBranchId;
  if (def && typeof def === 'object') return String(def._id || def.id || '');
  if (def) return String(def);
  const first = (user.branchIds || [])[0];
  if (first && typeof first === 'object') return String(first._id || first.id || '');
  return first ? String(first) : '';
}

function canListBranches(user) {
  if (!user || user.role === 'super_admin') return false;
  if (user.role === 'doctor') return user.approvalStatus === 'approved';
  return can(user, P.BRANCHES_VIEW) || can(user, P.QUEUE_MANAGE) || can(user, P.BILLING_VIEW);
}

function userBranchKey(user) {
  if (!user) return '';
  return `${user._id || user.id || ''}:${user.role}:${user.approvalStatus || ''}`;
}

export function BranchProvider({ children }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchIdState] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const branchIdRef = useRef(branchId);
  const failedKeyRef = useRef('');

  const setBranchId = useCallback((id) => {
    const next = id || '';
    setBranchIdState(next);
    branchIdRef.current = next;
    if (next) localStorage.setItem(STORAGE_KEY, next);
    else localStorage.removeItem(STORAGE_KEY);
    setBranchHeader(next);
  }, []);

  useEffect(() => {
    branchIdRef.current = branchId;
    setBranchHeader(branchId);
  }, [branchId]);

  const sessionKey = useMemo(() => userBranchKey(user), [user]);

  useEffect(() => {
    if (isStaffUser(user)) {
      const locked = staffPrimaryBranchId(user);
      if (locked && locked !== branchIdRef.current) setBranchId(locked);
    }
  }, [sessionKey, user, setBranchId]);

  const load = useCallback(() => {
    if (!canListBranches(user)) {
      setBranches([]);
      return;
    }
    // Do not retry the same session after a 403/failure
    if (failedKeyRef.current && failedKeyRef.current === userBranchKey(user)) {
      return;
    }

    api
      .get('/branches')
      .then((res) => {
        failedKeyRef.current = '';
        const list = res.data.branches || [];
        setBranches(list);
        if (isStaffUser(user)) {
          const locked = staffPrimaryBranchId(user) || (list[0] ? String(list[0]._id) : '');
          if (locked) setBranchId(locked);
          return;
        }
        const currentId = branchIdRef.current;
        if (currentId && !list.some((b) => String(b._id) === String(currentId))) {
          setBranchId('');
        }
      })
      .catch((err) => {
        setBranches([]);
        if (err?.response?.status === 403 || err?.response?.status === 401) {
          failedKeyRef.current = userBranchKey(user);
        }
      });
  }, [user, setBranchId]);

  useEffect(() => {
    // New user/approval session → allow a fresh attempt
    failedKeyRef.current = '';
    load();
  }, [sessionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = branches.find((b) => String(b._id) === String(branchId)) || null;

  const value = useMemo(
    () => ({ branches, branchId, setBranchId, current, reload: load }),
    [branches, branchId, setBranchId, current, load]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
};
