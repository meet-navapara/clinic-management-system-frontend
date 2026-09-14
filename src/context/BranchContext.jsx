import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setBranchHeader } from '../utils/api';
import { useAuth } from './AuthContext';
import { isStaffUser } from '../constants/permissions';

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

export function BranchProvider({ children }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchIdState] = useState(() => localStorage.getItem(STORAGE_KEY) || '');

  const setBranchId = useCallback((id) => {
    const next = id || '';
    setBranchIdState(next);
    if (next) localStorage.setItem(STORAGE_KEY, next);
    else localStorage.removeItem(STORAGE_KEY);
    setBranchHeader(next);
  }, []);

  useEffect(() => {
    setBranchHeader(branchId);
  }, [branchId]);

  useEffect(() => {
    if (isStaffUser(user)) {
      const locked = staffPrimaryBranchId(user);
      if (locked && locked !== branchId) setBranchId(locked);
    }
  }, [user, branchId, setBranchId]);

  const load = useCallback(() => {
    if (!user || user.role === 'super_admin') {
      setBranches([]);
      return;
    }
    api
      .get('/branches')
      .then((res) => {
        const list = res.data.branches || [];
        setBranches(list);
        if (isStaffUser(user)) {
          const locked = staffPrimaryBranchId(user) || (list[0] ? String(list[0]._id) : '');
          if (locked) setBranchId(locked);
          return;
        }
        if (branchId && !list.some((b) => String(b._id) === String(branchId))) {
          setBranchId('');
        }
      })
      .catch(() => {
        setBranches([]);
        if (!isStaffUser(user) && branchId) setBranchId('');
      });
  }, [user, branchId, setBranchId]);

  useEffect(() => {
    load();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = branches.find((b) => String(b._id) === String(branchId)) || null;

  return (
    <BranchContext.Provider value={{ branches, branchId, setBranchId, current, reload: load }}>
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
};
