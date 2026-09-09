import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Users, Stethoscope, Calendar } from 'lucide-react';
import { ROUTES } from '../constants/routes';

/** Phase 2 placeholder — full clinic admin tools land in later phases. */
export default function ClinicAdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="site-container py-8 sm:py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#a8841f] uppercase tracking-wide">Clinic Admin</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-gray-500 mt-2 max-w-xl">
            Your clinic admin account is ready. Staff management, revenue, and clinic settings will
            expand in upcoming phases. Existing doctors remain separate doctor accounts.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card">
            <Building2 className="w-8 h-8 text-[#a8841f] mb-3" />
            <h2 className="font-semibold text-gray-900">Clinic</h2>
            <p className="text-sm text-gray-500 mt-1">
              Multi-clinic tenancy is active. Your account is linked to a clinic organization.
            </p>
          </div>
          <div className="card">
            <Stethoscope className="w-8 h-8 text-[#a8841f] mb-3" />
            <h2 className="font-semibold text-gray-900">Doctors</h2>
            <p className="text-sm text-gray-500 mt-1 mb-3">
              Doctors can self-register and keep the doctor role.
            </p>
            <Link to={ROUTES.doctorSignup} className="text-sm text-primary-600 font-medium hover:underline">
              Open doctor signup →
            </Link>
          </div>
          <div className="card">
            <Users className="w-8 h-8 text-[#a8841f] mb-3" />
            <h2 className="font-semibold text-gray-900">Receptionists</h2>
            <p className="text-sm text-gray-500 mt-1 mb-3">
              Receptionist accounts are available for front-desk staff.
            </p>
            <Link
              to={ROUTES.receptionistSignup}
              className="text-sm text-primary-600 font-medium hover:underline"
            >
              Open receptionist signup →
            </Link>
          </div>
          <div className="card sm:col-span-2 lg:col-span-3">
            <Calendar className="w-8 h-8 text-[#a8841f] mb-3" />
            <h2 className="font-semibold text-gray-900">Coming next</h2>
            <p className="text-sm text-gray-500 mt-1">
              Phase 3 adds multi-doctor appointment booking with clinic scoping. Later phases add
              consultation, prescriptions, follow-ups, and revenue (receptionist-blocked).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
