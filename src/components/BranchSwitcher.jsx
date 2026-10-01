import { GitBranch } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { isStaffUser } from '../constants/permissions';
import Dropdown from './ui/Dropdown';

export default function BranchSwitcher({ compact, align }) {
  const { user } = useAuth();
  const { branches, branchId, setBranchId, current } = useBranch();
  const staffLocked = isStaffUser(user);
  const clinicWideAccess = user?.clinicWideAccess === true;
  const scopedDoctor =
    user?.role === 'doctor' &&
    (user?.clinicWideAccess === false || Array.isArray(user?.accessibleBranchIds));

  if (staffLocked || (scopedDoctor && branches.length <= 1)) {
    const label = current?.name || branches[0]?.name || 'Assigned branch';
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

  // Clinic-wide (Main) doctors: pick a branch to filter all pages, or All branches.
  const options = branches.map((b) => ({
    value: String(b._id),
    label: b.isDefault ? `${b.name} (Main)` : b.name,
  }));

  if (clinicWideAccess || (!scopedDoctor && user?.role === 'doctor')) {
    options.unshift({ value: '', label: 'All branches' });
  }

  return (
    <Dropdown
      value={branchId}
      onChange={setBranchId}
      options={options}
      placeholder="Select branch"
      ariaLabel="Select branch"
      size={compact ? 'sm' : 'md'}
      align={align ?? (compact ? 'right' : 'left')}
      icon={GitBranch}
      className={compact ? '!w-[11rem] sm:!w-[14rem] shrink-0' : 'w-full'}
    />
  );
}
