import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { isStaffUser } from '../constants/permissions';

export default function BranchSwitcher({ compact }) {
  const { user } = useAuth();
  const { branches, branchId, setBranchId, current } = useBranch();
  const staffLocked = isStaffUser(user);

  if (staffLocked) {
    const label = current?.name || 'Assigned branch';
    return (
      <div
        className={`min-w-0 truncate text-xs sm:text-sm text-ink-muted ${compact ? 'max-w-[11rem] sm:max-w-[14rem]' : ''}`}
        title={label}
      >
        <span className="sr-only">Branch</span>
        {label}
      </div>
    );
  }

  if (!branches.length) return null;
  return (
    <label className={`min-w-0 ${compact ? '' : 'block'}`}>
      {!compact && <span className="sr-only">Branch</span>}
      <select
        className="input-field !min-h-9 !py-1 !text-xs sm:!text-sm max-w-[11rem] sm:max-w-[14rem]"
        value={branchId}
        onChange={(e) => setBranchId(e.target.value)}
        aria-label="Select branch"
      >
        <option value="">All branches</option>
        {branches.map((b) => (
          <option key={b._id} value={b._id}>
            {b.name}
          </option>
        ))}
      </select>
    </label>
  );
}
