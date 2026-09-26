import { can, P, isStaffUser } from './permissions';

export const ROUTES = {
  home: '/',
  login: '/login',
  doctorSignup: '/doctor/signup',
  doctorLogin: '/doctor/login',
  doctorDashboard: '/doctor/dashboard',
  doctorPending: '/doctor/pending',
  doctorPatients: '/doctor/patients',
  doctorPatientNew: '/doctor/patients/new',
  doctorPatientDetail: (id) => `/doctor/patients/${id}`,
  doctorBook: '/doctor/appointments/new',
  doctorAppointmentDetail: (id) => `/doctor/appointments/${id}`,
  doctorCalendar: '/doctor/calendar',
  doctorInbox: '/doctor/inbox',
  doctorNotifications: '/doctor/notifications',
  doctorConsult: (appointmentId) => `/consult/${appointmentId}`,
  profile: '/profile',

  clinicAdminRegister: '/admin/register',
  clinicAdminLogin: '/admin/login',
  clinicAdminDashboard: '/admin/dashboard',
  clinicAdminDoctors: '/admin/doctors',
  clinicAdminDoctorDetail: (id) => `/admin/doctors/${id}`,
  clinicAdminCampaignTemplates: '/admin/campaign-templates',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  deskDashboard: '/desk',
  billing: '/billing',
  billingNew: '/billing/new',
  invoice: (id) => `/billing/${id}`,
  revenue: '/revenue',
  branches: '/branches',
  staff: '/staff',
  templates: '/templates',
  campaigns: '/campaigns',
  campaignNew: '/campaigns/new',
  campaign: (id) => `/campaigns/${id}`,
  printSettings: '/print-settings',
  search: '/search',
  printPreview: '/print/preview',
  print: (type, id) => `/print/${type}/${id}`,
};

export const AUTH_PATHS = [
  ROUTES.login,
  ROUTES.doctorSignup,
  ROUTES.doctorLogin,
  ROUTES.doctorPending,
  ROUTES.clinicAdminRegister,
  ROUTES.clinicAdminLogin,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
];

export function getPageMeta(pathname) {
  if (pathname === ROUTES.doctorDashboard) return { title: 'Dashboard', crumb: 'Practice', hideTitle: true };
  if (pathname === ROUTES.deskDashboard) return { title: 'Front desk', crumb: 'Clinic', hideTitle: true };
  if (pathname === ROUTES.doctorCalendar) return { title: 'Calendar', crumb: 'Practice', hideTitle: true };
  if (pathname === ROUTES.doctorPatients) return { title: 'Patients', crumb: 'Practice' };
  if (pathname === ROUTES.doctorPatientNew) {
    return { title: 'Add patient', crumb: 'Patients', backTo: ROUTES.doctorPatients };
  }
  if (pathname.startsWith('/doctor/patients/')) {
    return { title: 'Patient record', crumb: 'Patients', backTo: ROUTES.doctorPatients };
  }
  if (pathname === ROUTES.doctorBook) {
    return { title: 'Schedule visit', crumb: 'Appointments', backTo: ROUTES.doctorCalendar };
  }
  if (pathname.startsWith('/doctor/appointments/')) {
    return { title: 'Appointment', crumb: 'Calendar', backTo: ROUTES.doctorCalendar };
  }
  if (pathname.startsWith('/consult/')) {
    const appointmentId = pathname.split('/')[2];
    return {
      title: 'Consultation',
      crumb: 'Clinical',
      backTo: appointmentId ? ROUTES.doctorAppointmentDetail(appointmentId) : ROUTES.doctorCalendar,
    };
  }
  if (pathname === ROUTES.doctorInbox) return { title: 'Inbox', crumb: 'Practice' };
  if (pathname === ROUTES.doctorNotifications) return { title: 'Reminders', crumb: 'Practice' };
  if (pathname === ROUTES.profile) return { title: 'Settings', crumb: 'Account' };
  if (pathname === ROUTES.clinicAdminDashboard) {
    return { title: 'Super Admin', crumb: 'Platform', hideTitle: true };
  }
  if (pathname === ROUTES.clinicAdminDoctors) {
    return { title: 'Doctors', crumb: 'Platform', hideTitle: true };
  }
  if (pathname === ROUTES.clinicAdminCampaignTemplates) {
    return { title: 'WA Templates', crumb: 'Platform', hideTitle: true };
  }
  if (pathname.startsWith('/admin/doctors/')) {
    return { title: 'Doctor', crumb: 'Admin', backTo: ROUTES.clinicAdminDoctors, hideTitle: true };
  }
  if (pathname === ROUTES.billing) return { title: 'Billing', crumb: 'Finance' };
  if (pathname === ROUTES.billingNew) {
    return { title: 'New invoice', crumb: 'Billing', backTo: ROUTES.billing };
  }
  if (pathname.startsWith('/billing/')) {
    return { title: 'Invoice', crumb: 'Billing', backTo: ROUTES.billing };
  }
  if (pathname === ROUTES.revenue) return { title: 'Revenue', crumb: 'Finance' };
  if (pathname === ROUTES.branches) return { title: 'Branches', crumb: 'Clinic' };
  if (pathname === ROUTES.staff) return { title: 'Staff', crumb: 'Clinic' };
  if (pathname === ROUTES.templates) return { title: 'Clinical templates', crumb: 'Clinical' };
  if (pathname === ROUTES.campaigns) return { title: 'Campaigns', crumb: 'Marketing' };
  if (pathname === ROUTES.campaignNew || pathname.startsWith('/campaigns/')) {
    return { title: 'Campaign', crumb: 'Marketing', backTo: ROUTES.campaigns };
  }
  if (pathname === ROUTES.printSettings) return { title: 'Print settings', crumb: 'Clinic' };
  if (pathname === ROUTES.search) return { title: 'Search', crumb: 'Clinic', backTo: -1 };
  return { title: 'Clinic', crumb: '' };
}

export function getDashboardPath(role, user) {
  if (isStaffUser(user) || (role && isStaffUser({ role, ...user }))) {
    return ROUTES.deskDashboard;
  }
  if (role === 'doctor') {
    if (user?.approvalStatus && user.approvalStatus !== 'approved') {
      return ROUTES.doctorPending;
    }
    return ROUTES.doctorDashboard;
  }
  if (role === 'super_admin') {
    return ROUTES.clinicAdminDashboard;
  }
  return ROUTES.login;
}

const SHARED = [
  ROUTES.profile,
  ROUTES.billing,
  ROUTES.billingNew,
  ROUTES.revenue,
  ROUTES.branches,
  ROUTES.staff,
  ROUTES.templates,
  ROUTES.campaigns,
  ROUTES.campaignNew,
  ROUTES.printSettings,
  ROUTES.search,
  ROUTES.deskDashboard,
];

function startsShared(pathname) {
  return (
    pathname.startsWith('/billing/') ||
    pathname.startsWith('/campaigns/') ||
    pathname.startsWith('/print/') ||
    pathname.startsWith('/consult/') ||
    SHARED.includes(pathname)
  );
}

function permissionForPath(pathname) {
  if (pathname === ROUTES.deskDashboard || pathname === ROUTES.profile) return null;
  if (pathname === ROUTES.doctorCalendar || pathname.startsWith('/doctor/appointments/') || pathname === ROUTES.doctorBook) {
    return P.APPOINTMENTS_VIEW;
  }
  if (pathname.startsWith('/doctor/patients') || pathname === ROUTES.doctorPatientNew) return P.PATIENTS_VIEW;
  if (pathname.startsWith('/billing')) return P.BILLING_VIEW;
  if (pathname === ROUTES.revenue) return P.REVENUE_ALL;
  if (pathname === ROUTES.branches) return P.BRANCHES_VIEW;
  if (pathname === ROUTES.staff) return P.STAFF_MANAGE;
  if (pathname === ROUTES.templates) return [P.TEMPLATES_OWN, P.TEMPLATES_CLINIC];
  if (pathname.startsWith('/campaigns')) return P.CAMPAIGNS_MANAGE;
  if (pathname === ROUTES.printSettings) return P.PRINT_SETTINGS;
  if (pathname === ROUTES.search) return P.SEARCH;
  if (pathname.startsWith('/consult/')) return P.CONSULTATION;
  if (pathname.startsWith('/print/')) return null; // print routes check Staff anyPermission at the Route level
  return false;
}

export function isPathAllowedForRole(pathname, role, user) {
  if (role === 'doctor') {
    if (user?.approvalStatus && user.approvalStatus !== 'approved') {
      return pathname === ROUTES.doctorPending;
    }
    return (
      pathname === ROUTES.doctorDashboard ||
      pathname === ROUTES.doctorPatients ||
      pathname === ROUTES.doctorPatientNew ||
      pathname.startsWith('/doctor/patients/') ||
      pathname === ROUTES.doctorBook ||
      pathname.startsWith('/doctor/appointments/') ||
      pathname === ROUTES.doctorCalendar ||
      pathname === ROUTES.doctorInbox ||
      pathname === ROUTES.doctorNotifications ||
      startsShared(pathname)
    );
  }

  if (role === 'super_admin') {
    return (
      pathname === ROUTES.clinicAdminDashboard ||
      pathname === ROUTES.clinicAdminDoctors ||
      pathname === ROUTES.clinicAdminCampaignTemplates ||
      pathname.startsWith('/admin/doctors/') ||
      pathname === ROUTES.profile
    );
  }

  if (isStaffUser(user) || isStaffUser({ role })) {
    const needed = permissionForPath(pathname);
    if (needed === false) return false;
    if (needed === null) return true;
    const authUser = user || { role, permissions: user?.permissions };
    if (Array.isArray(needed)) return needed.some((perm) => can(authUser, perm));
    return can(authUser, needed);
  }

  return false;
}
