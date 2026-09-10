import { useEffect, useState } from 'react';
import { Clock, Ban, XCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthPageLayout from '../components/AuthPageLayout';
import AuthPageLogo from '../components/AuthPageLogo';
import { ROUTES } from '../constants/routes';
import toast from 'react-hot-toast';

function displayFirstName(name) {
  const first = name?.trim().split(/\s+/)[0];
  if (!first) return '';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default function DoctorPending() {
  const { user, logout, refreshUser } = useAuth();
  const status = user?.approvalStatus || 'pending';
  const firstName = displayFirstName(user?.name);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (status === 'approved') {
      window.location.assign(ROUTES.doctorDashboard);
      return undefined;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const next = await refreshUser();
        if (cancelled || !next) return;
        if (next.approvalStatus === 'approved') {
          toast.success('Your account is approved.');
          window.location.assign(ROUTES.doctorDashboard);
        }
      } catch {
        /* stay on this screen */
      }
    };

    check();
    const id = window.setInterval(check, 4000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [refreshUser, status]);

  const checkNow = async () => {
    setChecking(true);
    try {
      const next = await refreshUser();
      if (next?.approvalStatus === 'approved') {
        toast.success('Your account is approved.');
        window.location.assign(ROUTES.doctorDashboard);
        return;
      }
      toast('Still waiting for admin approval.');
    } catch {
      toast.error('Could not check status.');
    } finally {
      setChecking(false);
    }
  };

  const copy = {
    pending: {
      icon: Clock,
      title: 'Waiting for approval',
      body: `Hi${firstName ? ` ${firstName}` : ''}, your account is registered. A clinic admin must approve you before you can open the dashboard.`,
      iconWrap: 'bg-[#f3efe8] text-[#a8841f]',
    },
    approved: {
      icon: CheckCircle,
      title: "You're approved",
      body: 'Opening your dashboard…',
      iconWrap: 'bg-[#eef5f1] text-[#3d6b4f]',
    },
    rejected: {
      icon: XCircle,
      title: 'Registration not approved',
      body: 'Your doctor account was not approved. Please contact the clinic admin for more information.',
      iconWrap: 'bg-[#fef2f2] text-[#9b2c2c]',
    },
    suspended: {
      icon: Ban,
      title: 'Account suspended',
      body: 'Your doctor account is suspended. Contact the clinic admin to reactivate access.',
      iconWrap: 'bg-[#f3efe8] text-ink-muted',
    },
  };

  const view = copy[status] || copy.pending;
  const Icon = view.icon;

  return (
    <AuthPageLayout>
      <div className="text-center mb-4 sm:mb-6">
        <AuthPageLogo />
      </div>

      <div className="card text-center !p-6 sm:!p-8">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${view.iconWrap}`}
        >
          <Icon className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <p className="section-label mb-2">Account</p>
        <h1 className="page-title">{view.title}</h1>
        <p className="page-subtitle max-w-sm mx-auto">{view.body}</p>
        {status === 'pending' && (
          <p className="text-xs text-ink-faint mt-3">
            This page updates automatically when an admin approves you.
          </p>
        )}
        {status !== 'approved' && (
          <button
            type="button"
            className="btn-primary mt-6"
            onClick={() => {
              logout();
              window.location.assign(ROUTES.login);
            }}
          >
            Back to login
          </button>
        )}
        {status === 'pending' && (
          <button
            type="button"
            className="btn-secondary mt-3"
            disabled={checking}
            onClick={checkNow}
          >
            {checking ? 'Checking…' : 'Check status'}
          </button>
        )}
      </div>
    </AuthPageLayout>
  );
}
