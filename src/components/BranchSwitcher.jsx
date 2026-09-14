import { GitBranch } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { isStaffUser } from '../constants/permissions';
import Dropdown from './ui/Dropdown';

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

  const options = [
    { value: '', label: 'All branches' },
    ...branches.map((b) => ({ value: String(b._id), label: b.name })),
  ];

  return (
    <Dropdown
      value={branchId}
      onChange={setBranchId}
      options={options}
      placeholder="Select branch"
      ariaLabel="Select branch"
      size={compact ? 'sm' : 'md'}
      align="right"
      icon={GitBranch}
      className={compact ? '!w-[11rem] sm:!w-[14rem] shrink-0' : 'w-full'}
    />
  );
}
