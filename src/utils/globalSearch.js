import { format, isValid } from 'date-fns';
import { ROUTES } from '../constants/routes';

export const SEARCH_SECTIONS = [
  { key: 'patients', label: 'Patients' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'staff', label: 'Staff' },
];

export function searchRowLabel(key, row) {
  if (key === 'patients') {
    return `${row.name || 'Patient'}${row.patientCode ? ` · ${row.patientCode}` : ''}${row.phone ? ` · ${row.phone}` : ''}`;
  }
  if (key === 'appointments') {
    const date = row.appointmentDate ? new Date(row.appointmentDate) : null;
    const when = date && isValid(date) ? format(date, 'dd MMM') : '';
    const who = row.patientId?.name || 'Visit';
    return `${who}${when ? ` · ${when}` : ''}${row.timeSlot ? ` · ${row.timeSlot}` : ''}`;
  }
  if (key === 'invoices') {
    const who = row.patientId?.name ? ` · ${row.patientId.name}` : '';
    return `${row.invoiceNumber || 'Invoice'}${who}${row.paymentStatus ? ` · ${row.paymentStatus.replace(/_/g, ' ')}` : ''}`;
  }
  if (key === 'staff') {
    return `${row.name || 'Staff'}${row.role ? ` · ${row.role.replace(/_/g, ' ')}` : ''}${row.specialization ? ` · ${row.specialization}` : ''}`;
  }
  return row.name || 'Record';
}

export function searchRowLink(key, row) {
  const id = row._id || row.id;
  if (key === 'patients') return ROUTES.doctorPatientDetail(id);
  if (key === 'appointments') return ROUTES.doctorAppointmentDetail(id);
  if (key === 'invoices') return ROUTES.invoice(id);
  if (key === 'staff') return `${ROUTES.staff}?q=${encodeURIComponent(row.name || '')}`;
  return '#';
}

export function countSearchResults(results) {
  return SEARCH_SECTIONS.reduce((sum, section) => sum + (results[section.key]?.length || 0), 0);
}
