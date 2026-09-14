/** Mirrors backend: Super Admin has no clinic ops; Doctor is clinic administrator. */
export const P = {
  PATIENTS_VIEW: 'patients.view',
  PATIENTS_MANAGE: 'patients.manage',
  APPOINTMENTS_VIEW: 'appointments.view',
  APPOINTMENTS_MANAGE: 'appointments.manage',
  CONSULTATION: 'consultation.perform',
  PRESCRIPTION: 'prescription.manage',
  BILLING_VIEW: 'billing.view',
  BILLING_MANAGE: 'billing.manage',
  REVENUE_OWN: 'revenue.own',
  REVENUE_ALL: 'revenue.all',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',
  MEDICINE_USE: 'medicine.use',
  MEDICINE_MANAGE: 'medicine.manage',
  BRANCHES_VIEW: 'branches.view',
  BRANCHES_MANAGE: 'branches.manage',
  STAFF_MANAGE: 'staff.manage',
  CAMPAIGNS_MANAGE: 'campaigns.manage',
  CONSENT_TEMPLATES: 'consent.templates',
  CONSENT_CAPTURE: 'consent.capture',
  PRINT_SETTINGS: 'print.settings',
  QUEUE_MANAGE: 'queue.manage',
  TEMPLATES_OWN: 'templates.own',
  TEMPLATES_CLINIC: 'templates.clinic',
  AUDIT_VIEW: 'audit.view',
  SEARCH: 'search.use',
};

const ALL = Object.values(P);

export const ROLE_PERMISSIONS = {
  super_admin: [],
  doctor: ALL,
};

export const STAFF_TYPES = ['receptionist', 'nurse', 'assistant', 'accountant', 'other'];
export const AUTH_ROLES = ['super_admin', 'doctor'];
export const STAFF_LOGIN_ROLES = ['receptionist', 'nurse', 'assistant', 'clinic_manager'];

export const STAFF_TYPE_PERMISSIONS = {
  receptionist: [
    P.PATIENTS_VIEW,
    P.PATIENTS_MANAGE,
    P.APPOINTMENTS_VIEW,
    P.APPOINTMENTS_MANAGE,
    P.BILLING_VIEW,
    P.BILLING_MANAGE,
    P.QUEUE_MANAGE,
    P.CONSENT_CAPTURE,
  ],
  nurse: [
    P.PATIENTS_VIEW,
    P.APPOINTMENTS_VIEW,
    P.QUEUE_MANAGE,
    P.CONSENT_CAPTURE,
    P.MEDICINE_USE,
  ],
  assistant: [P.PATIENTS_VIEW, P.APPOINTMENTS_VIEW, P.QUEUE_MANAGE],
  accountant: [P.BILLING_VIEW, P.BILLING_MANAGE, P.REVENUE_ALL],
  other: [],
};

/** Modules shown when a Doctor assigns staff access. View/Manage map to existing permission keys. */
export const ACCESS_MODULES = [
  { id: 'appointments', label: 'Appointments', view: P.APPOINTMENTS_VIEW, manage: P.APPOINTMENTS_MANAGE },
  { id: 'patients', label: 'Patients', view: P.PATIENTS_VIEW, manage: P.PATIENTS_MANAGE },
  { id: 'queue', label: 'Queue', view: P.QUEUE_MANAGE },
  { id: 'billing', label: 'Billing / Invoices', view: P.BILLING_VIEW, manage: P.BILLING_MANAGE },
  { id: 'revenue', label: 'Revenue / Reports', view: P.REVENUE_ALL },
  { id: 'medicines', label: 'Medicines', view: P.MEDICINE_USE, manage: P.MEDICINE_MANAGE },
  { id: 'inventory', label: 'Inventory', view: P.INVENTORY_VIEW, manage: P.INVENTORY_MANAGE },
  { id: 'branches', label: 'Branches', view: P.BRANCHES_VIEW, manage: P.BRANCHES_MANAGE },
  { id: 'staff', label: 'Staff', view: P.STAFF_MANAGE },
  { id: 'templates', label: 'Doctor Notes / Templates', view: P.TEMPLATES_OWN, manage: P.TEMPLATES_CLINIC },
  { id: 'consent', label: 'Consent Forms', view: P.CONSENT_CAPTURE, manage: P.CONSENT_TEMPLATES },
  { id: 'campaigns', label: 'Campaigns', view: P.CAMPAIGNS_MANAGE },
  { id: 'consult', label: 'Consultations', view: P.CONSULTATION },
  { id: 'rx', label: 'Prescriptions', view: P.PRESCRIPTION },
  { id: 'print', label: 'Print / Clinic Settings', view: P.PRINT_SETTINGS },
];

export function isStaffUser(user) {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'doctor' || user.role === 'patient') return false;
  return Boolean(user.staffType) || STAFF_LOGIN_ROLES.includes(user.role);
}

export function can(user, permission) {
  if (!user || !permission) return false;
  if (user.role === 'super_admin') return false;
  if (user.role === 'doctor') return true;
  const list = user.permissions?.length ? user.permissions : [];
  return list.includes(permission);
}

export function moduleCount(user) {
  if (!user) return 0;
  if (user.role === 'doctor') return ACCESS_MODULES.length;
  const list = new Set(user.permissions || []);
  return ACCESS_MODULES.filter((m) => list.has(m.view) || (m.manage && list.has(m.manage))).length;
}

export function togglePermission(current, key, on) {
  const set = new Set(current || []);
  if (on) set.add(key);
  else set.delete(key);
  return [...set];
}
