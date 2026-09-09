import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorDetail from './pages/DoctorDetail';
import MyAppointments from './pages/MyAppointments';
import Profile from './pages/Profile';
import ClinicAdminRegister from './pages/ClinicAdminRegister';
import DoctorSignup from './pages/DoctorSignup';
import DoctorLogin from './pages/DoctorLogin';
import ReceptionistSignup from './pages/ReceptionistSignup';
import ReceptionistLogin from './pages/ReceptionistLogin';
import ClinicAdminDashboard from './pages/ClinicAdminDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import ReceptionistBookAppointment from './pages/ReceptionistBookAppointment';
import { AUTH_PATHS, ROUTES } from './constants/routes';

export default function App() {
  const { pathname } = useLocation();
  const hideNavbar = AUTH_PATHS.includes(pathname);

  return (
    <div
      className={`flex flex-col w-full ${
        hideNavbar ? 'h-dvh max-h-dvh overflow-hidden' : 'min-h-dvh'
      }`}
    >
      {!hideNavbar && <Navbar />}
      <main
        className={`flex-1 w-full flex flex-col min-h-0 min-w-0 ${
          hideNavbar ? 'overflow-hidden' : ''
        }`}
      >
        <div className="flex flex-1 flex-col min-h-0 min-w-0 w-full">
          <Routes>
            <Route path={ROUTES.home} element={<Landing />} />

            <Route
              path={ROUTES.login}
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path={ROUTES.register}
              element={
                <GuestRoute>
                  <Register />
                </GuestRoute>
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
              path={ROUTES.doctorSignup}
              element={
                <GuestRoute>
                  <DoctorSignup />
                </GuestRoute>
              }
            />
            <Route
              path={ROUTES.doctorLogin}
              element={
                <GuestRoute>
                  <DoctorLogin />
                </GuestRoute>
              }
            />
            <Route
              path={ROUTES.receptionistSignup}
              element={
                <GuestRoute>
                  <ReceptionistSignup />
                </GuestRoute>
              }
            />
            <Route
              path={ROUTES.receptionistLogin}
              element={
                <GuestRoute>
                  <ReceptionistLogin />
                </GuestRoute>
              }
            />

            <Route
              path={ROUTES.patientDashboard}
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.doctorDashboard}
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.receptionistDashboard}
              element={
                <ProtectedRoute allowedRoles={['receptionist']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.receptionistBook}
              element={
                <ProtectedRoute allowedRoles={['receptionist']}>
                  <ReceptionistBookAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.clinicAdminDashboard}
              element={
                <ProtectedRoute allowedRoles={['clinic_admin', 'super_admin']}>
                  <ClinicAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/:id"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <DoctorDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.appointments}
              element={
                <ProtectedRoute allowedRoles={['patient', 'doctor']}>
                  <MyAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.profile}
              element={
                <ProtectedRoute
                  allowedRoles={['patient', 'doctor', 'receptionist', 'clinic_admin', 'super_admin']}
                >
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
