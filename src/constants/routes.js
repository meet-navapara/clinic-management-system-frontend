export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  /** One-time clinic admin bootstrap (setup key). */
  clinicAdminRegister: '/admin/register',
  /** @deprecated alias — kept for older links */
  doctorRegister: '/admin/register',

  doctorSignup: '/doctor/signup',
  doctorLogin: '/doctor/login',
  doctorDashboard: '/doctor/dashboard',

  receptionistSignup: '/receptionist/signup',
  receptionistLogin: '/receptionist/login',
  receptionistDashboard: '/receptionist/dashboard',
  receptionistBook: '/receptionist/appointments/new',

  clinicAdminDashboard: '/admin/dashboard',

  patientDashboard: '/patient/dashboard',
  doctorDetail: (id) => `/doctor/${id}`,
  appointments: '/appointments',
  profile: '/profile',
};

export const AUTH_PATHS = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.clinicAdminRegister,
  ROUTES.doctorSignup,
  ROUTES.doctorLogin,
  ROUTES.receptionistSignup,
  ROUTES.receptionistLogin,
];

export function getDashboardPath(role) {
  switch (role) {
    case 'doctor':
      return ROUTES.doctorDashboard;
    case 'receptionist':
      return ROUTES.receptionistDashboard;
    case 'clinic_admin':
    case 'super_admin':
      return ROUTES.clinicAdminDashboard;
    case 'patient':
    default:
      return ROUTES.patientDashboard;
  }
}

export function isPathAllowedForRole(pathname, role) {
  if (role === 'doctor') {
    return (
      pathname === ROUTES.doctorDashboard ||
      pathname === ROUTES.appointments ||
      pathname === ROUTES.profile
    );
  }

  if (role === 'receptionist') {
    return (
      pathname === ROUTES.receptionistDashboard ||
      pathname === ROUTES.receptionistBook ||
      pathname === ROUTES.profile
    );
  }

  if (role === 'clinic_admin' || role === 'super_admin') {
    return pathname === ROUTES.clinicAdminDashboard || pathname === ROUTES.profile;
  }

  if (role === 'patient') {
    return (
      pathname === ROUTES.patientDashboard ||
      pathname === ROUTES.appointments ||
      pathname === ROUTES.profile ||
      pathname.startsWith('/doctor/')
    );
  }

  return false;
}
