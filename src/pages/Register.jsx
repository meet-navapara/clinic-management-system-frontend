import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { APP_NAME } from '../constants/branding';
import toast from 'react-hot-toast';
import { Mail, User, Phone } from 'lucide-react';
import AuthPageLogo from '../components/AuthPageLogo';
import AuthPageLayout from '../components/AuthPageLayout';
import PasswordInput from '../components/PasswordInput';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const redirectAfterAuth = useAuthRedirect();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await register(form);
      toast.success('Account created successfully!');
      redirectAfterAuth(data.user.role);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout maxWidth="max-w-lg">
      <div className="text-center mb-3 sm:mb-5">
        <AuthPageLogo className="mb-3 sm:mb-4" />
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Create Patient Account</h1>
        <p className="text-gray-500 mt-1 text-xs sm:text-base">Join {APP_NAME} to book consultations</p>
      </div>

      <div className="card !p-3.5 sm:!p-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <fieldset disabled={loading} className="space-y-3 sm:space-y-4 border-0 p-0 m-0 min-w-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  name="name"
                  className="input-field pl-9 sm:pl-10 !py-2 sm:!py-2.5"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    className="input-field pl-9 sm:pl-10 !py-2 sm:!py-2.5"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    name="phone"
                    className="input-field pl-9 sm:pl-10 !py-2 sm:!py-2.5"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <PasswordInput
                name="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn-primary w-full !py-2.5 sm:!py-3">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </fieldset>
        </form>

        <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
