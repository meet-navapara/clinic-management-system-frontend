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
import DoctorRegister from './pages/DoctorRegister';
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
              path={ROUTES.doctorRegister}
              element={
                <GuestRoute>
                  <DoctorRegister />
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
                <ProtectedRoute allowedRoles={['patient', 'doctor']}>
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
