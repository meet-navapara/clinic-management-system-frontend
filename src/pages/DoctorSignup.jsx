import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import toast from 'react-hot-toast';
import { Mail, User, Phone } from 'lucide-react';
import AuthPageLogo from '../components/AuthPageLogo';
import AuthPageLayout from '../components/AuthPageLayout';
import PasswordInput from '../components/PasswordInput';
import { ROUTES } from '../constants/routes';
import RequiredMark from '../components/ui/RequiredMark';
import { normalizeIndianMobile, isValidEmail, meetsPasswordComplexity, STRONG_PASSWORD_MESSAGE } from '../utils/validation';

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'password', 'confirmPassword', 'qualification', 'licenseNumber', 'city', 'clinicName', 'setupKey'];

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-red-600 mt-1" role="alert">
      {message}
    </p>
  );
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
    errors.phone = 'Mobile number must be a valid 10-digit Indian number (+91).';
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

  if (!form.setupKey.trim()) errors.setupKey = 'Admin setup key is required.';

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
    bio: '',
    setupKey: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { registerDoctorAccount } = useAuth();
  const redirectAfterAuth = useAuthRedirect();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name] && !(name === 'password' && prev.confirmPassword)) return prev;
      const next = { ...prev };
      delete next[name];
      if (name === 'password') delete next.confirmPassword;
      return next;
    });
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
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      const firstKey = REQUIRED_FIELDS.find((key) => errors[key]) || Object.keys(errors)[0];
      document.getElementById(`signup-${firstKey}`)?.focus();
      toast.error(errors[firstKey]);
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
      }
      toast.error(err.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout maxWidth="max-w-2xl" backTo={ROUTES.login}>
      <div className="text-center mb-3 sm:mb-5">
        <AuthPageLogo className="mb-3 sm:mb-4" />
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Doctor Sign up</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Admin approval required before dashboard access</p>
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
                <div className="relative">
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
                    inputMode="tel"
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

            <div>
              <label htmlFor="signup-setupKey" className="block text-sm font-medium text-gray-700 mb-1">
                Admin setup key <RequiredMark />
              </label>
              <input
                id="signup-setupKey"
                name="setupKey"
                type="password"
                autoComplete="off"
                className="input-field"
                required
                value={form.setupKey}
                onChange={handleChange}
                placeholder="Provided by Super Admin"
                aria-invalid={Boolean(fieldErrors.setupKey)}
                aria-describedby={fieldErrors.setupKey ? 'signup-setupKey-error' : undefined}
              />
              <FieldError id="signup-setupKey-error" message={fieldErrors.setupKey} />
              <p className="text-xs text-gray-500 mt-1">Required to create or join a clinic in production.</p>
            </div>

            <div>
              <label htmlFor="signup-bio" className="block text-sm font-medium text-gray-700 mb-1">
                Short bio
              </label>
              <textarea
                id="signup-bio"
                name="bio"
                className="input-field"
                rows={2}
                value={form.bio}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn-primary w-full !py-3">
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
    </AuthPageLayout>
  );
}
