import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import toast from 'react-hot-toast';
import { Check, Mail, User, Phone } from 'lucide-react';
import AuthPageLogo from '../components/AuthPageLogo';
import AuthPageLayout from '../components/AuthPageLayout';
import PasswordInput from '../components/PasswordInput';
import Modal from '../components/ui/Modal';
import { ROUTES } from '../constants/routes';
import RequiredMark from '../components/ui/RequiredMark';
import api from '../utils/api';
import { normalizeIndianMobile, formatIndianMobileInput, isValidEmail, meetsPasswordComplexity, STRONG_PASSWORD_MESSAGE } from '../utils/validation';

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'password', 'confirmPassword', 'qualification', 'licenseNumber', 'city', 'clinicName'];
const FIELD_LABELS = {
  name: 'Full name',
  email: 'Email',
  phone: 'Phone',
  password: 'Password',
  confirmPassword: 'Confirm password',
  qualification: 'Qualification',
  licenseNumber: 'License no.',
  city: 'City',
  clinicName: 'Practice / clinic name',
  experience: 'Years of experience',
};
const RESEND_COOLDOWN_SEC = 60;

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-red-600 mt-1" role="alert">
      {message}
    </p>
  );
}

function toastMissingFields(errors) {
  const keys = [
    ...REQUIRED_FIELDS.filter((key) => errors[key]),
    ...Object.keys(errors).filter((key) => !REQUIRED_FIELDS.includes(key)),
  ];
  if (!keys.length) return;

  // Email verification is the most common blocker — call it out first and clearly.
  if (errors.email && /verif/i.test(errors.email)) {
    toast.error('Email verification is missing. Click Verify next to Email, then enter the OTP.');
    if (keys.length === 1) return;
  }

  if (keys.length === 1) {
    toast.error(errors[keys[0]]);
    return;
  }

  const labels = keys.map((key) => {
    if (key === 'email' && errors.email && /verif/i.test(errors.email)) {
      return 'Email verification';
    }
    return FIELD_LABELS[key] || key;
  });
  toast.error(`Please fix: ${labels.join(', ')}`);
}

function validateSignup(form) {
  const errors = {};

  const name = form.name.trim();
  if (!name) errors.name = 'Full name is required.';
  else if (name.length > 120) errors.name = 'Name is too long.';

  const email = form.email.trim();
  if (!email) errors.email = 'Email is required.';
  else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';

  if (!form.phone.trim()) errors.phone = 'Mobile number is required.';
  else if (!normalizeIndianMobile(form.phone)) {
    errors.phone = 'Mobile number must be exactly 10 digits.';
  }

  if (!form.password) errors.password = 'Password is required.';
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.';
  else if (!meetsPasswordComplexity(form.password)) errors.password = STRONG_PASSWORD_MESSAGE;

  if (!form.confirmPassword) errors.confirmPassword = 'Confirm password is required.';
  else if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';

  if (!form.qualification.trim()) errors.qualification = 'Qualification is required.';

  if (!form.licenseNumber.trim()) errors.licenseNumber = 'License number is required.';

  if (!form.city.trim()) errors.city = 'City is required.';

  if (!form.clinicName.trim()) errors.clinicName = 'Practice / clinic name is required.';

  if (form.experience !== '') {
    const years = Number(form.experience);
    if (!Number.isInteger(years) || years < 0) {
      errors.experience = 'Experience must be 0 or more.';
    }
  }

  return errors;
}

export default function DoctorSignup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialization: '',
    qualification: '',
    licenseNumber: '',
    experience: '',
    clinicName: '',
    city: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const { registerDoctorAccount } = useAuth();
  const redirectAfterAuth = useAuthRedirect();

  const emailIsVerified =
    emailVerified && verifiedEmail && verifiedEmail === form.email.trim().toLowerCase();

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = window.setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? formatIndianMobileInput(value) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    if (name === 'email') {
      const next = value.trim().toLowerCase();
      if (!verifiedEmail || next !== verifiedEmail) {
        setEmailVerified(false);
      } else {
        setEmailVerified(true);
      }
    }
    setFieldErrors((prev) => {
      if (!prev[name] && !(name === 'password' && prev.confirmPassword)) return prev;
      const next = { ...prev };
      delete next[name];
      if (name === 'password') delete next.confirmPassword;
      return next;
    });
  };

  const sendOtp = async ({ openModal = true } = {}) => {
    const email = form.email.trim();
    if (!email) {
      setFieldErrors((prev) => ({ ...prev, email: 'Email is required.' }));
      toast.error('Email is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
      toast.error('Please enter a valid email address.');
      return;
    }

    setSendingOtp(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/email-otp/send', { email });
      toast.success(res.data?.message || 'Verification code sent.');
      setResendIn(res.data?.cooldownSeconds || RESEND_COOLDOWN_SEC);
      setOtp('');
      if (openModal) setOtpOpen(true);
    } catch (err) {
      const cooldown = err.response?.data?.cooldownSeconds;
      if (cooldown) setResendIn(cooldown);
      const message = err.response?.data?.message || 'Could not send verification code.';
      const apiErrors = err.response?.data?.errors;
      if (apiErrors?.email) setFieldErrors((prev) => ({ ...prev, email: apiErrors.email }));
      toast.error(message);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async (e) => {
    e?.preventDefault?.();
    const code = String(otp || '').replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
      setOtpError('Enter the 6-digit verification code.');
      return;
    }
    setVerifyingOtp(true);
    setOtpError('');
    try {
      await api.post('/auth/email-otp/verify', { email: form.email.trim(), otp: code });
      const normalized = form.email.trim().toLowerCase();
      setEmailVerified(true);
      setVerifiedEmail(normalized);
      setOtpOpen(false);
      setOtp('');
      setFieldErrors((prev) => {
        if (!prev.email) return prev;
        const next = { ...prev };
        delete next.email;
        return next;
      });
      toast.success('Email verified.');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Incorrect or expired code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleConfirmPasswordBlur = (e) => {
    if (e.currentTarget.parentElement?.contains(e.relatedTarget)) return;

    if (form.confirmPassword === form.password) {
      setFieldErrors((prev) => {
        if (!prev.confirmPassword) return prev;
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
      return;
    }
    setFieldErrors((prev) => ({
      ...prev,
      confirmPassword: form.confirmPassword
        ? 'Passwords do not match.'
        : 'Confirm password is required.',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateSignup(form);
    if (!emailIsVerified) {
      errors.email = 'Email verification is missing. Click Verify email to continue.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      const firstKey = REQUIRED_FIELDS.find((key) => errors[key]) || Object.keys(errors)[0];
      document.getElementById(`signup-${firstKey}`)?.focus();
      toastMissingFields(errors);
      return;
    }

    setLoading(true);
    try {
      const data = await registerDoctorAccount(form);
      toast.success('Account created. Waiting for admin approval.');
      redirectAfterAuth(data.user.role, data.user);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object' && !Array.isArray(apiErrors)) {
        setFieldErrors(apiErrors);
        const firstKey = REQUIRED_FIELDS.find((key) => apiErrors[key]) || Object.keys(apiErrors)[0];
        document.getElementById(`signup-${firstKey}`)?.focus();
        toastMissingFields(apiErrors);
      } else {
        toast.error(err.response?.data?.message || 'Signup failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout maxWidth="max-w-2xl">
      <div className="text-center mb-3 sm:mb-5">
        <AuthPageLogo className="mb-3 sm:mb-4" />
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <fieldset disabled={loading} className="space-y-4 border-0 p-0 m-0 min-w-0">
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1">
                Full name <RequiredMark />
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="signup-name"
                  name="name"
                  className="input-field pl-10"
                  placeholder="Dr. Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={120}
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'signup-name-error' : undefined}
                />
              </div>
              <FieldError id="signup-name-error" message={fieldErrors.name} />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <RequiredMark />
                </label>
                <div className="flex gap-2 items-stretch">
                  <div className="relative flex-1 min-w-0">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      className="input-field pl-10"
                      placeholder="doctor@clinic.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
                    />
                  </div>
                  {emailIsVerified ? (
                    <span className="inline-flex items-center gap-1 shrink-0 px-2.5 text-xs sm:text-sm font-semibold text-emerald-700">
                      <Check className="w-4 h-4" aria-hidden />
                      Verified
                    </span>
                  ) : (
                    <button
                      id="signup-verify-email"
                      type="button"
                      className="btn-secondary shrink-0"
                      disabled={sendingOtp || loading}
                      onClick={() => sendOtp({ openModal: true })}
                    >
                      {sendingOtp ? 'Sending…' : 'Verify email'}
                    </button>
                  )}
                </div>
                <FieldError id="signup-email-error" message={fieldErrors.email} />
              </div>
              <div className="min-w-0">
                <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <RequiredMark />
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="signup-phone"
                    name="phone"
                    className="input-field pl-10"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? 'signup-phone-error' : undefined}
                  />
                </div>
                <FieldError id="signup-phone-error" message={fieldErrors.phone} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <RequiredMark />
                </label>
                <PasswordInput
                  id="signup-password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'signup-password-error' : undefined}
                />
                <FieldError id="signup-password-error" message={fieldErrors.password} />
              </div>
              <div className="min-w-0">
                <label htmlFor="signup-confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password <RequiredMark />
                </label>
                <PasswordInput
                  id="signup-confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleConfirmPasswordBlur}
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? 'signup-confirmPassword-error' : undefined}
                />
                <FieldError id="signup-confirmPassword-error" message={fieldErrors.confirmPassword} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="signup-specialization" className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <input
                  id="signup-specialization"
                  name="specialization"
                  className="input-field"
                  placeholder="e.g. Panchakarma"
                  value={form.specialization}
                  onChange={handleChange}
                />
              </div>
              <div className="min-w-0">
                <label htmlFor="signup-qualification" className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification <RequiredMark />
                </label>
                <input
                  id="signup-qualification"
                  name="qualification"
                  className="input-field"
                  placeholder="BAMS, MD"
                  value={form.qualification}
                  onChange={handleChange}
                  required
                  aria-invalid={Boolean(fieldErrors.qualification)}
                  aria-describedby={fieldErrors.qualification ? 'signup-qualification-error' : undefined}
                />
                <FieldError id="signup-qualification-error" message={fieldErrors.qualification} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="signup-licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  License no. <RequiredMark />
                </label>
                <input
                  id="signup-licenseNumber"
                  name="licenseNumber"
                  className="input-field"
                  value={form.licenseNumber}
                  onChange={handleChange}
                  required
                  aria-invalid={Boolean(fieldErrors.licenseNumber)}
                  aria-describedby={fieldErrors.licenseNumber ? 'signup-licenseNumber-error' : undefined}
                />
                <FieldError id="signup-licenseNumber-error" message={fieldErrors.licenseNumber} />
              </div>
              <div className="min-w-0">
                <label htmlFor="signup-experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Years of experience
                </label>
                <input
                  id="signup-experience"
                  name="experience"
                  type="number"
                  min="0"
                  className="input-field"
                  value={form.experience}
                  onChange={handleChange}
                  aria-invalid={Boolean(fieldErrors.experience)}
                  aria-describedby={fieldErrors.experience ? 'signup-experience-error' : undefined}
                />
                <FieldError id="signup-experience-error" message={fieldErrors.experience} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="signup-city" className="block text-sm font-medium text-gray-700 mb-1">
                  City <RequiredMark />
                </label>
                <input
                  id="signup-city"
                  name="city"
                  className="input-field"
                  value={form.city}
                  onChange={handleChange}
                  required
                  aria-invalid={Boolean(fieldErrors.city)}
                  aria-describedby={fieldErrors.city ? 'signup-city-error' : undefined}
                />
                <FieldError id="signup-city-error" message={fieldErrors.city} />
              </div>
              <div className="min-w-0">
                <label htmlFor="signup-clinicName" className="block text-sm font-medium text-gray-700 mb-1">
                  Practice / clinic name <RequiredMark />
                </label>
                <input
                  id="signup-clinicName"
                  name="clinicName"
                  className="input-field"
                  required
                  value={form.clinicName}
                  onChange={handleChange}
                  placeholder="Your clinic name"
                  aria-invalid={Boolean(fieldErrors.clinicName)}
                  aria-describedby={fieldErrors.clinicName ? 'signup-clinicName-error' : undefined}
                />
                <FieldError id="signup-clinicName-error" message={fieldErrors.clinicName} />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full !py-3"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </fieldset>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to={ROUTES.login} className="text-accent-700 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>

      <Modal
        open={otpOpen}
        title="Verify email"
        onClose={() => {
          if (!verifyingOtp) setOtpOpen(false);
        }}
      >
        <p className="text-xs sm:text-sm text-ink-muted mb-4">
          Enter the 6-digit code sent to <span className="font-medium text-ink">{form.email.trim()}</span>.
        </p>
        <form onSubmit={verifyOtp} className="space-y-4">
          <div>
            <label htmlFor="signup-otp" className="label-field">
              Verification code
            </label>
            <input
              id="signup-otp"
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
              aria-describedby={otpError ? 'signup-otp-error' : undefined}
              autoFocus
            />
            {otpError ? (
              <p id="signup-otp-error" className="text-xs text-red-600 mt-1" role="alert">
                {otpError}
              </p>
            ) : null}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={verifyingOtp || otp.length !== 6}>
            {verifyingOtp ? 'Verifying…' : 'Verify code'}
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={sendingOtp || verifyingOtp || resendIn > 0}
            onClick={() => sendOtp({ openModal: false })}
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : sendingOtp ? 'Sending…' : 'Resend code'}
          </button>
        </form>
      </Modal>
    </AuthPageLayout>
  );
}
