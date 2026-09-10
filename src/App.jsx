import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import DoctorSignup from './pages/DoctorSignup';
import DoctorPending from './pages/DoctorPending';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatients from './pages/DoctorPatients';
import DoctorPatientNew from './pages/DoctorPatientNew';
import DoctorPatientDetail from './pages/DoctorPatientDetail';
import DoctorBookAppointment from './pages/DoctorBookAppointment';
import DoctorAppointmentDetail from './pages/DoctorAppointmentDetail';
import DoctorCalendar from './pages/DoctorCalendar';
import DoctorInbox from './pages/DoctorInbox';
import DoctorNotifications from './pages/DoctorNotifications';
import Profile from './pages/Profile';
import ClinicAdminRegister from './pages/ClinicAdminRegister';
import AdminLogin from './pages/AdminLogin';
import ClinicAdminDashboard from './pages/ClinicAdminDashboard';
import AdminDoctorDetail from './pages/AdminDoctorDetail';
import { AUTH_PATHS, ROUTES } from './constants/routes';

function PublicLayout() {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  return (
    <div
      className={`flex flex-col w-full ${
        isAuthPage ? 'h-dvh max-h-dvh overflow-hidden' : 'min-h-dvh'
      }`}
    >
      {!isAuthPage && <Navbar />}
      <main
        className={`flex-1 w-full flex flex-col min-h-0 min-w-0 ${
          isAuthPage ? 'overflow-hidden' : ''
        }`}
      >
        <div className="flex flex-1 flex-col min-h-0 min-w-0 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function DoctorPanel({ children }) {
  return (
    <ProtectedRoute allowedRoles={['doctor']} requireApprovedDoctor>
      {children}
    </ProtectedRoute>
  );
}

function AdminPanel({ children }) {
  return (
    <ProtectedRoute allowedRoles={['clinic_admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.home} element={<Landing />} />
        <Route
          path={ROUTES.login}
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route path={ROUTES.doctorLogin} element={<Navigate to={ROUTES.login} replace />} />
        <Route
          path={ROUTES.doctorSignup}
          element={
            <GuestRoute>
              <DoctorSignup />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.doctorPending}
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorPending />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.clinicAdminRegister}
          element={
            <GuestRoute>
              <ClinicAdminRegister />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.clinicAdminLogin}
          element={
            <GuestRoute>
              <AdminLogin />
            </GuestRoute>
          }
        />
      </Route>

      <Route element={<AppShell />}>
        <Route
          path={ROUTES.clinicAdminDashboard}
          element={
            <AdminPanel>
              <ClinicAdminDashboard />
            </AdminPanel>
          }
        />
        <Route
          path="/admin/doctors/:id"
          element={
            <AdminPanel>
              <AdminDoctorDetail />
            </AdminPanel>
          }
        />
        <Route
          path={ROUTES.doctorDashboard}
          element={
            <DoctorPanel>
              <DoctorDashboard />
            </DoctorPanel>
          }
        />
        <Route
          path={ROUTES.doctorCalendar}
          element={
            <DoctorPanel>
              <DoctorCalendar />
            </DoctorPanel>
          }
        />
        <Route
          path={ROUTES.doctorPatients}
          element={
            <DoctorPanel>
              <DoctorPatients />
            </DoctorPanel>
          }
        />
        <Route
          path={ROUTES.doctorPatientNew}
          element={
            <DoctorPanel>
              <DoctorPatientNew />
            </DoctorPanel>
          }
        />
        <Route
          path="/doctor/patients/:id"
          element={
            <DoctorPanel>
              <DoctorPatientDetail />
            </DoctorPanel>
          }
        />
        <Route
          path={ROUTES.doctorBook}
          element={
            <DoctorPanel>
              <DoctorBookAppointment />
            </DoctorPanel>
          }
        />
        <Route
          path="/doctor/appointments/:id"
          element={
            <DoctorPanel>
              <DoctorAppointmentDetail />
            </DoctorPanel>
          }
        />
        <Route
          path={ROUTES.doctorInbox}
          element={
            <DoctorPanel>
              <DoctorInbox />
            </DoctorPanel>
          }
        />
        <Route
          path={ROUTES.doctorNotifications}
          element={
            <DoctorPanel>
              <DoctorNotifications />
            </DoctorPanel>
          }
        />
        <Route
          path={ROUTES.profile}
          element={
            <ProtectedRoute allowedRoles={['doctor', 'clinic_admin', 'super_admin']}>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}
