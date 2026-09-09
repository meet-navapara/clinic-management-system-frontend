export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  doctorRegister: '/admin/register',
  patientDashboard: '/patient/dashboard',
  doctorDashboard: '/doctor/dashboard',
  doctorDetail: (id) => `/doctor/${id}`,
  appointments: '/appointments',
  profile: '/profile',
};

export const AUTH_PATHS = [ROUTES.login, ROUTES.register, ROUTES.doctorRegister];

export function getDashboardPath(role) {
  return role === 'doctor' ? ROUTES.doctorDashboard : ROUTES.patientDashboard;
}

export function isPathAllowedForRole(pathname, role) {
  if (role === 'doctor') {
    return (
      pathname === ROUTES.doctorDashboard ||
      pathname === ROUTES.appointments ||
      pathname === ROUTES.profile
    );
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
