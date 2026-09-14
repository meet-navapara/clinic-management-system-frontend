import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import AuthPageLogo from '../components/AuthPageLogo';
import AuthPageLayout from '../components/AuthPageLayout';
import PasswordInput from '../components/PasswordInput';
import { ROUTES } from '../constants/routes';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const redirectAfterAuth = useAuthRedirect();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success('Welcome back!');
      redirectAfterAuth(data.user.role, data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="text-center mb-3 sm:mb-5">
        <AuthPageLogo className="mb-3 sm:mb-4" />
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Clinic sign in</h1>
      </div>

      <div className="card !p-3.5 sm:!p-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <fieldset disabled={loading} className="space-y-3 sm:space-y-4 border-0 p-0 m-0 min-w-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="email"
                  className="input-field pl-9 sm:pl-10 !py-2 sm:!py-2.5"
                  placeholder="you@clinic.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <PasswordInput
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary w-full !py-2.5 sm:!py-3">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </fieldset>
        </form>

        <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
          New doctor?{' '}
          <Link to={ROUTES.doctorSignup} className="text-accent-700 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
