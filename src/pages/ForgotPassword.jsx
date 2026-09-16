import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthPageLayout from '../components/AuthPageLayout';
import AuthPageLogo from '../components/AuthPageLogo';
import PasswordInput from '../components/PasswordInput';
import api from '../utils/api';
import { ROUTES } from '../constants/routes';
import { isValidEmail, meetsPasswordComplexity, STRONG_PASSWORD_MESSAGE } from '../utils/validation';

const RESEND_COOLDOWN_SEC = 60;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email | otp | password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = window.setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  const sendOtp = async () => {
    if (!isValidEmail(email)) {
      toast.error('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/forgot-password/send-otp', { email: email.trim() });
      toast.success(res.data?.message || 'Verification code sent.');
      setResendIn(res.data?.cooldownSeconds || RESEND_COOLDOWN_SEC);
      setOtp('');
      setStep('otp');
    } catch (err) {
      const cooldown = err.response?.data?.cooldownSeconds;
      if (cooldown) setResendIn(cooldown);
      toast.error(err.response?.data?.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e?.preventDefault?.();
    const code = String(otp || '').replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
      setOtpError('Enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      await api.post('/auth/forgot-password/verify-otp', { email: email.trim(), otp: code });
      toast.success('OTP verified.');
      setStep('password');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Incorrect or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!meetsPasswordComplexity(password)) {
      toast.error(STRONG_PASSWORD_MESSAGE);
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/reset', {
        email: email.trim(),
        password,
        confirmPassword,
      });
      toast.success('Password updated. Please sign in.');
      navigate(ROUTES.login);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout maxWidth="max-w-md">
      <div className="text-center mb-5">
        <AuthPageLogo className="mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">Forgot password</h1>
        <p className="text-sm text-gray-600 mt-1">
          {step === 'email' && 'Enter your registered email to receive a verification code.'}
          {step === 'otp' && 'Enter the 6-digit code sent to your email.'}
          {step === 'password' && 'Choose a new password for your account.'}
        </p>
      </div>

      {step === 'email' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Checking…' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={verifyOtp} className="space-y-4">
          <p className="text-xs sm:text-sm text-ink-muted">
            Code sent to <span className="font-medium text-ink">{email.trim()}</span>
          </p>
          <div>
            <label htmlFor="forgot-otp" className="block text-sm font-medium text-gray-700 mb-1">
              Verification code
            </label>
            <input
              id="forgot-otp"
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
              autoFocus
            />
            {otpError ? (
              <p className="text-xs text-red-600 mt-1" role="alert">
                {otpError}
              </p>
            ) : null}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={loading || resendIn > 0}
            onClick={sendOtp}
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
          </button>
          <button
            type="button"
            className="btn-ghost w-full"
            disabled={loading}
            onClick={() => {
              setStep('email');
              setOtp('');
              setOtpError('');
            }}
          >
            Change email
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500 mt-6">
        Remembered it?{' '}
        <Link to={ROUTES.login} className="text-accent-700 font-medium hover:underline">
          Login
        </Link>
      </p>
    </AuthPageLayout>
  );
}
