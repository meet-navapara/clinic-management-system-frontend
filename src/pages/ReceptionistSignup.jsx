import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Mail, User, Phone, Building2 } from 'lucide-react';
import AuthPageLogo from '../components/AuthPageLogo';
import AuthPageLayout from '../components/AuthPageLayout';
import PasswordInput from '../components/PasswordInput';
import { ROUTES } from '../constants/routes';

export default function ReceptionistSignup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    clinicId: '',
  });
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const { registerReceptionist } = useAuth();
  const redirectAfterAuth = useAuthRedirect();

  useEffect(() => {
    api
      .get('/clinics')
      .then((res) => {
        const list = res.data.clinics || [];
        setClinics(list);
        if (list.length === 1) {
          setForm((prev) => ({ ...prev, clinicId: list[0]._id }));
        }
      })
      .catch(() => toast.error('Could not load clinics.'));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.clinicId) delete payload.clinicId;
      const data = await registerReceptionist(payload);
      toast.success('Receptionist account created!');
      redirectAfterAuth(data.user.role);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Signup failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout maxWidth="max-w-lg">
      <div className="text-center mb-3 sm:mb-5">
        <AuthPageLogo className="mb-3 sm:mb-4" />
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Receptionist Signup</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Join your clinic front desk team</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4 border-0 p-0 m-0 min-w-0">
            {clinics.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    name="clinicId"
                    className="input-field pl-10"
                    value={form.clinicId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select clinic</option>
                    {clinics.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="name"
                  className="input-field pl-10"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    className="input-field pl-10"
                    placeholder="reception@clinic.com"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <PasswordInput
                name="password"
                iconClassName="w-5 h-5"
                inputClassName="input-field pl-10 pr-11"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn-primary w-full !py-3">
              {loading ? 'Creating account...' : 'Create Receptionist Account'}
            </button>
          </fieldset>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link
            to={ROUTES.receptionistLogin}
            className="text-primary-600 font-medium hover:underline"
          >
            Receptionist sign in
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
