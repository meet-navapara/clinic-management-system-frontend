import { useEffect, useState } from 'react';
import api from '../utils/api';
import Dropdown from './ui/Dropdown';
import { useBranch } from '../context/BranchContext';
import { patientDisplayName } from '../utils/display';

function toPatientOption(patient) {
  if (!patient) return null;
  return {
    value: String(patient._id),
    label: patientDisplayName(patient),
    description: [patient.phone, patient.patientCode].filter(Boolean).join(' · '),
  };
}

export default function PatientPicker({
  value,
  onChange,
  initialPatient,
  placeholder = 'Select patient',
  required = true,
  disabled = false,
  id,
}) {
  const { branchId } = useBranch();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(initialPatient || null);

  useEffect(() => {
    if (initialPatient) setSelected(initialPatient);
  }, [initialPatient]);

  useEffect(() => {
    if (!value) setSelected(null);
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(
      () => {
        setLoading(true);
        api
          .get('/patients', {
            params: {
              limit: 20,
              ...(query.trim() ? { search: query.trim() } : {}),
            },
          })
          .then((res) => setResults(res.data.patients || []))
          .catch(() => setResults([]))
          .finally(() => setLoading(false));
      },
      query.trim() ? 250 : 0
    );
    return () => clearTimeout(t);
  }, [query, branchId, open]);

  const options = results.map(toPatientOption).filter(Boolean);
  const selectedOption = toPatientOption(selected);
  if (selectedOption && !options.some((opt) => opt.value === selectedOption.value)) {
    options.unshift(selectedOption);
  }

  return (
    <Dropdown
      id={id}
      searchable
      required={required}
      disabled={disabled}
      value={value}
      placeholder={placeholder}
      searchPlaceholder="Type name, phone, or ID"
      emptyMessage="No matching patients."
      ariaLabel="Patient"
      loading={loading}
      options={options}
      onSearch={setQuery}
      onOpenChange={setOpen}
      onChange={(id) => {
        const patient = results.find((row) => String(row._id) === String(id)) || selected;
        setSelected(patient);
        onChange(id);
      }}
    />
  );
}
