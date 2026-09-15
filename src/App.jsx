import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import DoctorSignup from './pages/DoctorSignup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
import BillingList from './pages/BillingList';
import InvoiceEditor from './pages/InvoiceEditor';
import InvoiceDetail from './pages/InvoiceDetail';
import BranchesPage from './pages/BranchesPage';
import StaffPage from './pages/StaffPage';
import MedicinesPage from './pages/MedicinesPage';
import InventoryPage from './pages/InventoryPage';
import TemplatesPage from './pages/TemplatesPage';
import ConsentPage from './pages/ConsentPage';
import QueuePage from './pages/QueuePage';
import QueueDisplay from './pages/QueueDisplay';
import { CampaignsPage, CampaignEditor } from './pages/CampaignsPage';
import PrintSettingsPage from './pages/PrintSettingsPage';
import PrintDocument from './pages/PrintDocument';
import ConsultationPage from './pages/ConsultationPage';
import DeskDashboard from './pages/DeskDashboard';
import SearchPage from './pages/SearchPage';
import RevenuePage from './pages/RevenuePage';
import { AUTH_PATHS, ROUTES } from './constants/routes';
import { P } from './constants/permissions';

const CLINIC = ['doctor', 'staff'];
const SUPER_ADMIN = ['super_admin'];

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

function Staff({ roles = CLINIC, children, requireApprovedDoctor = true, permission, anyPermission }) {
  return (
    <ProtectedRoute
      allowedRoles={roles}
      requireApprovedDoctor={requireApprovedDoctor}
      permission={permission}
      anyPermission={anyPermission}
    >
      {children}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          path={ROUTES.home}
          element={
            <GuestRoute>
              <Landing />
            </GuestRoute>
          }
        />
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
        <Route
          path={ROUTES.forgotPassword}
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.resetPassword}
          element={
            <GuestRoute>
              <ResetPassword />
            </GuestRoute>
          }
        />
      </Route>

      <Route
        path={ROUTES.queueDisplay}
        element={
          <Staff permission={P.QUEUE_MANAGE}>
            <QueueDisplay />
          </Staff>
        }
      />
      <Route
        path={ROUTES.printPreview}
        element={
          <Staff anyPermission={[P.PRINT_SETTINGS, P.BILLING_VIEW, P.CONSULTATION, P.QUEUE_MANAGE, P.CONSENT_CAPTURE]}>
            <PrintDocument />
          </Staff>
        }
      />
      <Route
        path="/print/:type/:id"
        element={
          <Staff anyPermission={[P.BILLING_VIEW, P.CONSULTATION, P.QUEUE_MANAGE, P.CONSENT_CAPTURE]}>
            <PrintDocument />
          </Staff>
        }
      />

      <Route element={<AppShell />}>
        <Route
          path={ROUTES.clinicAdminDashboard}
          element={
            <Staff roles={SUPER_ADMIN}>
              <ClinicAdminDashboard />
            </Staff>
          }
        />
        <Route
          path="/admin/doctors/:id"
          element={
            <Staff roles={SUPER_ADMIN}>
              <AdminDoctorDetail />
            </Staff>
          }
        />
        <Route
          path={ROUTES.deskDashboard}
          element={
            <Staff>
              <DeskDashboard />
            </Staff>
          }
        />
        <Route
          path={ROUTES.doctorDashboard}
          element={
            <Staff roles={['doctor']} requireApprovedDoctor>
              <DoctorDashboard />
            </Staff>
          }
        />
        <Route
          path={ROUTES.doctorCalendar}
          element={
            <Staff requireApprovedDoctor permission={P.APPOINTMENTS_VIEW}>
              <DoctorCalendar />
            </Staff>
          }
        />
        <Route
          path={ROUTES.doctorPatients}
          element={
            <Staff requireApprovedDoctor permission={P.PATIENTS_VIEW}>
              <DoctorPatients />
            </Staff>
          }
        />
        <Route
          path={ROUTES.doctorPatientNew}
          element={
            <Staff requireApprovedDoctor permission={P.PATIENTS_MANAGE}>
              <DoctorPatientNew />
            </Staff>
          }
        />
        <Route
          path="/doctor/patients/:id"
          element={
            <Staff requireApprovedDoctor permission={P.PATIENTS_VIEW}>
              <DoctorPatientDetail />
            </Staff>
          }
        />
        <Route
          path={ROUTES.doctorBook}
          element={
            <Staff requireApprovedDoctor permission={P.APPOINTMENTS_MANAGE}>
              <DoctorBookAppointment />
            </Staff>
          }
        />
        <Route
          path="/doctor/appointments/:id"
          element={
            <Staff requireApprovedDoctor permission={P.APPOINTMENTS_VIEW}>
              <DoctorAppointmentDetail />
            </Staff>
          }
        />
        <Route
          path="/consult/:appointmentId"
          element={
            <Staff requireApprovedDoctor permission={P.CONSULTATION}>
              <ConsultationPage />
            </Staff>
          }
        />
        <Route
          path={ROUTES.doctorInbox}
          element={
            <Staff roles={['doctor']} requireApprovedDoctor>
              <DoctorInbox />
            </Staff>
          }
        />
        <Route
          path={ROUTES.doctorNotifications}
          element={
            <Staff roles={['doctor']} requireApprovedDoctor>
              <DoctorNotifications />
            </Staff>
          }
        />
        <Route path={ROUTES.billing} element={<Staff permission={P.BILLING_VIEW}><BillingList /></Staff>} />
        <Route path={ROUTES.billingNew} element={<Staff permission={P.BILLING_MANAGE}><InvoiceEditor /></Staff>} />
        <Route path="/billing/:id" element={<Staff permission={P.BILLING_VIEW}><InvoiceDetail /></Staff>} />
        <Route path={ROUTES.revenue} element={<Staff permission={P.REVENUE_ALL}><RevenuePage /></Staff>} />
        <Route path={ROUTES.branches} element={<Staff anyPermission={[P.BRANCHES_VIEW, P.BRANCHES_MANAGE]}><BranchesPage /></Staff>} />
        <Route path={ROUTES.staff} element={<Staff roles={['doctor']}><StaffPage /></Staff>} />
        <Route path={ROUTES.medicines} element={<Staff anyPermission={[P.MEDICINE_USE, P.MEDICINE_MANAGE]}><MedicinesPage /></Staff>} />
        <Route path={ROUTES.inventory} element={<Staff anyPermission={[P.INVENTORY_VIEW, P.INVENTORY_MANAGE]}><InventoryPage /></Staff>} />
        <Route path={ROUTES.templates} element={<Staff anyPermission={[P.TEMPLATES_OWN, P.TEMPLATES_CLINIC]}><TemplatesPage /></Staff>} />
        <Route path={ROUTES.consent} element={<Staff anyPermission={[P.CONSENT_CAPTURE, P.CONSENT_TEMPLATES]}><ConsentPage /></Staff>} />
        <Route path={ROUTES.queue} element={<Staff permission={P.QUEUE_MANAGE}><QueuePage /></Staff>} />
        <Route path={ROUTES.campaigns} element={<Staff permission={P.CAMPAIGNS_MANAGE}><CampaignsPage /></Staff>} />
        <Route path={ROUTES.campaignNew} element={<Staff permission={P.CAMPAIGNS_MANAGE}><CampaignEditor /></Staff>} />
        <Route path="/campaigns/:id" element={<Staff permission={P.CAMPAIGNS_MANAGE}><CampaignEditor /></Staff>} />
        <Route path={ROUTES.printSettings} element={<Staff permission={P.PRINT_SETTINGS}><PrintSettingsPage /></Staff>} />
        <Route path={ROUTES.search} element={<Staff permission={P.SEARCH}><SearchPage /></Staff>} />
        <Route
          path={ROUTES.profile}
          element={
            <ProtectedRoute allowedRoles={['doctor', 'super_admin', 'staff']}>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}
