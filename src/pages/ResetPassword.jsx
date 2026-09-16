import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthPageLayout from '../components/AuthPageLayout';
import AuthPageLogo from '../components/AuthPageLogo';
import PasswordInput from '../components/PasswordInput';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { ROUTES } from '../constants/routes';
import { meetsPasswordComplexity, STRONG_PASSWORD_MESSAGE } from '../utils/validation';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const redirectAfterAuth = useAuthRedirect();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Reset link is missing or invalid.');
      return;
    }
    if (!meetsPasswordComplexity(password)) {
      toast.error(STRONG_PASSWORD_MESSAGE);
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      if (res.data?.token) sessionStorage.setItem('token', res.data.token);
      if (res.data?.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        await refreshUser().catch(() => {});
        toast.success('Password updated.');
        redirectAfterAuth(res.data.user.role, res.data.user);
        return;
      }
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
        <h1 className="text-xl font-semibold text-gray-900">Reset password</h1>
        <p className="text-sm text-gray-600 mt-1">Choose a new password for your account.</p>
      </div>
      {!token ? (
        <p className="text-sm text-red-600 text-center">
          This reset link is invalid.{' '}
          <Link to={ROUTES.forgotPassword} className="font-medium underline">
            Request a new one
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthPageLayout>
  );
}
