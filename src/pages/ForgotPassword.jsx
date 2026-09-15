import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthPageLayout from '../components/AuthPageLayout';
import AuthPageLogo from '../components/AuthPageLogo';
import api from '../utils/api';
import { ROUTES } from '../constants/routes';
import { isValidEmail } from '../utils/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('If that email is registered, a reset link was sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout maxWidth="max-w-md" backTo={ROUTES.login}>
      <div className="text-center mb-5">
        <AuthPageLogo className="mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">Forgot password</h1>
        <p className="text-sm text-gray-600 mt-1">We will email a reset link if the account exists.</p>
      </div>
      {sent ? (
        <p className="text-sm text-gray-700 text-center">
          Check your inbox. Then{' '}
          <Link to={ROUTES.login} className="text-primary-700 font-medium">
            return to sign in
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthPageLayout>
  );
}
