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

export default function DoctorSignup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    qualification: '',
    licenseNumber: '',
    experience: '',
    clinicName: '',
    city: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const { registerDoctorAccount } = useAuth();
  const redirectAfterAuth = useAuthRedirect();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await registerDoctorAccount(form);
      toast.success('Account created. Waiting for admin approval.');
      redirectAfterAuth(data.user.role, data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout maxWidth="max-w-lg">
      <div className="text-center mb-3 sm:mb-5">
        <AuthPageLogo className="mb-3 sm:mb-4" />
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Doctor Sign up</h1>
        <p className="text-sm text-gray-500 mt-1">Admin approval required before dashboard access</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4 border-0 p-0 m-0 min-w-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="name"
                  className="input-field pl-10"
                  placeholder="Dr. Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  className="input-field pl-10"
                  placeholder="doctor@clinic.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="phone"
                  className="input-field pl-10"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <PasswordInput
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Min 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input
                name="specialization"
                className="input-field"
                placeholder="e.g. Panchakarma"
                value={form.specialization}
                onChange={handleChange}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                <input
                  name="qualification"
                  className="input-field"
                  placeholder="BAMS, MD"
                  value={form.qualification}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License no.</label>
                <input
                  name="licenseNumber"
                  className="input-field"
                  value={form.licenseNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of experience</label>
                <input
                  name="experience"
                  type="number"
                  min="0"
                  className="input-field"
                  value={form.experience}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input name="city" className="input-field" value={form.city} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Practice / clinic name</label>
              <input
                name="clinicName"
                className="input-field"
                required
                value={form.clinicName}
                onChange={handleChange}
                placeholder="Your clinic name"
              />
              <p className="text-xs text-gray-500 mt-1">Creates your own clinic — not shared with other doctors</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short bio</label>
              <textarea
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
