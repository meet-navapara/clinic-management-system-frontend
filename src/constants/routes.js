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
  profile: '/profile',

  clinicAdminRegister: '/admin/register',
  clinicAdminLogin: '/admin/login',
  clinicAdminDashboard: '/admin/dashboard',
  clinicAdminDoctorDetail: (id) => `/admin/doctors/${id}`,
};

export const AUTH_PATHS = [
  ROUTES.login,
  ROUTES.doctorSignup,
  ROUTES.doctorLogin,
  ROUTES.doctorPending,
  ROUTES.clinicAdminRegister,
  ROUTES.clinicAdminLogin,
];

export function getPageMeta(pathname) {
  if (pathname === ROUTES.doctorDashboard) return { title: 'Dashboard', crumb: 'Practice', hideTitle: true };
  if (pathname === ROUTES.doctorCalendar) return { title: 'Calendar', crumb: 'Practice', hideTitle: true };
  if (pathname === ROUTES.doctorPatients) return { title: 'Patients', crumb: 'Practice' };
  if (pathname === ROUTES.doctorPatientNew) return { title: 'Add patient', crumb: 'Patients' };
  if (pathname.startsWith('/doctor/patients/')) return { title: 'Patient record', crumb: 'Patients' };
  if (pathname === ROUTES.doctorBook) return { title: 'Schedule visit', crumb: 'Appointments' };
  if (pathname.startsWith('/doctor/appointments/')) return { title: 'Appointment', crumb: 'Calendar' };
  if (pathname === ROUTES.doctorInbox) return { title: 'Inbox', crumb: 'Practice' };
  if (pathname === ROUTES.doctorNotifications) return { title: 'Reminders', crumb: 'Practice' };
  if (pathname === ROUTES.profile) return { title: 'Settings', crumb: 'Account' };
  if (pathname === ROUTES.clinicAdminDashboard) return { title: 'Clinic admin', crumb: 'Admin' };
  if (pathname.startsWith('/admin/doctors/')) return { title: 'Doctor', crumb: 'Admin' };
  return { title: 'Clinic', crumb: '' };
}

export function getDashboardPath(role, user) {
  if (role === 'doctor') {
    if (user?.approvalStatus && user.approvalStatus !== 'approved') {
      return ROUTES.doctorPending;
    }
    return ROUTES.doctorDashboard;
  }
  if (role === 'clinic_admin' || role === 'super_admin') {
    return ROUTES.clinicAdminDashboard;
  }
  return ROUTES.login;
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
      pathname === ROUTES.profile
    );
  }

  if (role === 'clinic_admin' || role === 'super_admin') {
    return (
      pathname === ROUTES.clinicAdminDashboard ||
      pathname.startsWith('/admin/doctors/') ||
      pathname === ROUTES.profile
    );
  }

  return false;
}
