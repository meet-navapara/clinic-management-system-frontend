/** Display helpers shared across doctor/admin pages */

export function patientDisplayName(patient) {
  if (!patient) return 'Patient';
  if (patient.name) return patient.name;
  const parts = [patient.firstName, patient.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : 'Patient';
}

export function formatPatientCode(code) {
  return code || '—';
}

export function confirmAction(message) {
  return window.confirm(message);
}
