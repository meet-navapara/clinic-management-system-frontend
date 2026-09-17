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
    }
  }, [status]);

  // No automatic polling — only refresh when the user clicks "Check status"
  const checkNow = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const next = await refreshUser();
      if (next?.approvalStatus === 'approved') {
        toast.success('Your account is approved.');
        window.location.assign(ROUTES.doctorDashboard);
        return;
      }
      toast('Still waiting for approval.');
    } catch {
      toast.error('Could not check status.');
    } finally {
      setChecking(false);
    }
  };

  const goLogin = () => {
    logout();
    window.location.assign(ROUTES.login);
  };

  const copy = {
    pending: {
      icon: Clock,
      eyebrow: 'Pending review',
      title: 'Waiting for approval',
      body: `Hi${firstName ? ` ${firstName}` : ''}, your doctor account is registered. A Super Admin will review it before you can sign in to your clinic.`,
      hint: 'Click “Check status” after an admin reviews your account.',
      iconWrap: 'bg-[#f3efe8] text-[#a8841f]',
    },
    approved: {
      icon: CheckCircle,
      eyebrow: 'Approved',
      title: "You're approved",
      body: 'Opening your clinic dashboard…',
      hint: '',
      iconWrap: 'bg-[#eef5f1] text-[#3d6b4f]',
    },
    rejected: {
      icon: XCircle,
      eyebrow: 'Not approved',
      title: 'Registration not approved',
      body: 'Your doctor account was not approved. Contact Super Admin if you need help.',
      hint: '',
      iconWrap: 'bg-[#fef2f2] text-[#9b2c2c]',
    },
    suspended: {
      icon: Ban,
      eyebrow: 'Suspended',
      title: 'Account suspended',
      body: 'Your doctor account is suspended. Contact Super Admin to restore access.',
      hint: '',
      iconWrap: 'bg-[#f3efe8] text-ink-muted',
    },
  };

  const view = copy[status] || copy.pending;
  const Icon = view.icon;

  return (
    <AuthPageLayout>
      <div className="text-center mb-3 sm:mb-5">
        <AuthPageLogo className="mb-3 sm:mb-4" />
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{view.title}</h1>
      </div>

      <div className="card !p-5 sm:!p-6 text-center">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${view.iconWrap}`}
        >
          <Icon className="w-7 h-7" strokeWidth={1.75} aria-hidden="true" />
        </div>

        <p className="section-label mb-3">{view.eyebrow}</p>

        <p className="text-sm sm:text-[15px] text-ink-muted leading-relaxed max-w-[22rem] mx-auto">
          {view.body}
        </p>

        {user?.email && status === 'pending' && (
          <p className="mt-3 text-xs text-ink-faint truncate" title={user.email}>
            Signed in as {user.email}
          </p>
        )}

        {view.hint && (
          <p className="mt-4 text-xs text-ink-faint leading-relaxed">{view.hint}</p>
        )}

        {status !== 'approved' && (
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5">
            {status === 'pending' && (
              <button
                type="button"
                className="btn-secondary flex-1"
                disabled={checking}
                onClick={checkNow}
              >
                {checking ? 'Checking…' : 'Check status'}
              </button>
            )}
            <button type="button" className="btn-primary flex-1" onClick={goLogin}>
              Back to login
            </button>
          </div>
        )}
      </div>
    </AuthPageLayout>
  );
}
