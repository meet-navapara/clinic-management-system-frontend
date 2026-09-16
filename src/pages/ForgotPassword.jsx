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
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success(res.data?.message || 'Password reset link sent.');
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset link.');
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
          {sent
            ? 'Check your email for a link to reset your password.'
            : 'Enter your registered email and we will send you a password reset link.'}
        </p>
      </div>

      {sent ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-ink-muted">
            Link sent to <span className="font-medium text-ink">{email.trim()}</span>. It expires in 1
            hour.
          </p>
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={loading}
            onClick={() => {
              setSent(false);
            }}
          >
            Use a different email
          </button>
        </div>
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

      <p className="text-center text-sm text-gray-500 mt-6">
        Remembered it?{' '}
        <Link to={ROUTES.login} className="text-accent-700 font-medium hover:underline">
          Login
        </Link>
      </p>
    </AuthPageLayout>
  );
}
