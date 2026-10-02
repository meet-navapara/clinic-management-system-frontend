import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import AuthPageLogo from '../components/AuthPageLogo';
import AuthPageLayout from '../components/AuthPageLayout';
import PasswordInput from '../components/PasswordInput';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import Modal from '../components/ui/Modal';
import api from '../utils/api';
import { ROUTES } from '../constants/routes';
import { validateLoginFields } from '../utils/validation';
import RequiredMark from '../components/ui/RequiredMark';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const resendTimer = useRef(null);
  const { login } = useAuth();
  const redirectAfterAuth = useAuthRedirect();

  useEffect(() => {
    return () => {
      if (resendTimer.current) clearInterval(resendTimer.current);
    };
  }, []);

  const startResendCooldown = (seconds = 60) => {
    setResendIn(seconds);
    if (resendTimer.current) clearInterval(resendTimer.current);
    resendTimer.current = setInterval(() => {
      setResendIn((n) => {
        if (n <= 1) {
          clearInterval(resendTimer.current);
          resendTimer.current = null;
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const sendVerifyOtp = async ({ openModal = true } = {}) => {
    const email = form.email.trim();
    if (!email) {
      toast.error('Enter your email first.');
      return;
    }
    setSendingOtp(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/email-otp/login/send', { email });
      toast.success(res.data?.message || 'Verification code sent.');
      startResendCooldown(Number(res.data?.cooldownSeconds) || 60);
      if (openModal) {
        setOtp('');
        setVerifyOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const completeLogin = async () => {
    const data = await login(form.email, form.password);
    toast.success('Welcome back!');
    redirectAfterAuth(data.user.role, data.user);
  };

  const verifyLoginOtp = async (e) => {
    e.preventDefault();
    const code = String(otp || '').replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
      setOtpError('Enter the 6-digit verification code.');
      return;
    }
    setVerifyingOtp(true);
    setOtpError('');
    try {
      await api.post('/auth/email-otp/login/verify', {
        email: form.email.trim(),
        otp: code,
      });
      toast.success('Email verified. Signing you in…');
      setVerifyOpen(false);
      setLoading(true);
      await completeLogin();
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Could not verify code.');
      setLoading(false);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateLoginFields(form);
    setFieldErrors(errors);
    if (errors.email || errors.password) {
      const firstKey = errors.email ? 'email' : 'password';
      document.getElementById(`login-${firstKey}`)?.focus();
      toast.error(errors[firstKey]);
      return;
    }

    setLoading(true);
    try {
      await completeLogin();
    } catch (err) {
      setLoading(false);
      const data = err.response?.data;
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error(data.message || 'Please verify your email first.');
        await sendVerifyOtp({ openModal: true });
        return;
      }
      toast.error(data?.message || 'Login failed.');
    }
  };

  return (
    <AuthPageLayout>
      <LoadingOverlay
        show={loading}
        message="Signing you in…"
        fullscreen
      />

      <div className="text-center mb-3 sm:mb-5">
        <AuthPageLogo className="mb-3 sm:mb-4" />
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Sign in</h1>
      </div>

      <div className="card !p-3.5 sm:!p-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
          <fieldset disabled={loading} className="space-y-3 sm:space-y-4 border-0 p-0 m-0 min-w-0">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <RequiredMark />
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className="input-field pl-9 sm:pl-10 !py-2 sm:!py-2.5"
                  placeholder="you@clinic.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                />
              </div>
              {fieldErrors.email && (
                <p id="login-email-error" className="text-xs text-red-600 mt-1" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <RequiredMark />
              </label>
              <PasswordInput
                id="login-password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              />
              {fieldErrors.password && (
                <p id="login-password-error" className="text-xs text-red-600 mt-1" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary w-full !py-2.5 sm:!py-3">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </fieldset>
        </form>

        <p className="text-center text-xs sm:text-sm text-gray-500 mt-3">
          <Link to={ROUTES.forgotPassword} className="text-accent-700 font-semibold hover:underline">
            Forgot password?
          </Link>
        </p>

        <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
          Don't have an account?{' '}
          <Link to={ROUTES.doctorSignup} className="text-accent-700 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      <Modal
        open={verifyOpen}
        title="Verify email to sign in"
        onClose={() => {
          if (!verifyingOtp && !sendingOtp) setVerifyOpen(false);
        }}
      >
        <p className="text-xs sm:text-sm text-ink-muted mb-4">
          This account has not verified email yet. Enter the 6-digit code sent to{' '}
          <span className="font-medium text-ink">{form.email.trim()}</span>.
        </p>
        <form onSubmit={verifyLoginOtp} className="space-y-4">
          <div>
            <label htmlFor="login-otp" className="label-field">
              Verification code
            </label>
            <input
              id="login-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="input-field tracking-[0.35em] text-center text-base font-semibold"
              placeholder="••••••"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                setOtpError('');
              }}
              aria-invalid={Boolean(otpError)}
              aria-describedby={otpError ? 'login-otp-error' : undefined}
              autoFocus
            />
            {otpError ? (
              <p id="login-otp-error" className="text-xs text-red-600 mt-1" role="alert">
                {otpError}
              </p>
            ) : null}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={verifyingOtp || otp.length !== 6}>
            {verifyingOtp ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={sendingOtp || verifyingOtp || resendIn > 0}
            onClick={() => sendVerifyOtp({ openModal: false })}
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : sendingOtp ? 'Sending…' : 'Resend code'}
          </button>
        </form>
      </Modal>
    </AuthPageLayout>
  );
}
