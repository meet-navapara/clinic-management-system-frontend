import { format, subYears } from 'date-fns';
import Datepicker, { defaultDobViewDate } from './Datepicker';

function todayIso() {
  return format(new Date(), 'yyyy-MM-dd');
}

function earliestDobIso() {
  return format(subYears(new Date(), 120), 'yyyy-MM-dd');
}

export default function DobDatepicker({
  id,
  value = '',
  onChange,
  disabled = false,
  required = false,
  className = 'w-full',
  placeholder = 'Select DOB',
}) {
  return (
    <Datepicker
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      min={earliestDobIso()}
      max={todayIso()}
      placeholder={placeholder}
      className={className}
      defaultViewDate={defaultDobViewDate()}
    />
  );
}
