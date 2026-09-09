import { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';

import api from '../utils/api';

import toast from 'react-hot-toast';

import { Mail, User, Phone, Stethoscope, KeyRound } from 'lucide-react';
import AuthPageLogo from '../components/AuthPageLogo';
import AuthPageLayout from '../components/AuthPageLayout';
import PasswordInput from '../components/PasswordInput';
import PageLoader from '../components/PageLoader';



export default function DoctorRegister() {

  const [form, setForm] = useState({

    name: '',

    email: '',

    password: '',

    phone: '',

    setupKey: '',

    specialization: '',

    experience: '',

    consultationFee: '',

    bio: '',

  });

  const [loading, setLoading] = useState(false);

  const [checking, setChecking] = useState(true);

  const [doctorExists, setDoctorExists] = useState(false);

  const { registerDoctor } = useAuth();

  const redirectAfterAuth = useAuthRedirect();



  useEffect(() => {

    api

      .get('/auth/setup-status')

      .then((res) => setDoctorExists(res.data.doctorExists))

      .catch(() => toast.error('Could not verify setup status.'))

      .finally(() => setChecking(false));

  }, []);



  const handleChange = (e) => {

    setForm({ ...form, [e.target.name]: e.target.value });

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      const payload = {

        ...form,

        experience: Number(form.experience) || 0,

        consultationFee: Number(form.consultationFee) || 500,

      };

      const data = await registerDoctor(payload);

      toast.success('Doctor admin account created!');

      redirectAfterAuth(data.user.role);

    } catch (err) {

      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Setup failed.';

      toast.error(msg);

    } finally {

      setLoading(false);

    }

  };



  if (checking) {

    return (
      <AuthPageLayout>
        <PageLoader message="Checking setup status..." compact />
      </AuthPageLayout>
    );

  }



  if (doctorExists) {

    return (
      <AuthPageLayout>
        <AuthPageLogo className="mb-3 sm:mb-4 mx-auto flex" />
        <div className="card text-center !p-3.5 sm:!p-6">

          <Stethoscope className="w-12 h-12 text-[#a8841f] mx-auto mb-4" />

          <h1 className="text-xl font-bold text-gray-900 mb-2">Doctor Account Already Set Up</h1>

          <p className="text-gray-500 text-sm mb-6">

            The clinic doctor admin account already exists. Use the common login page to sign in.

          </p>

          <Link to="/login" className="btn-primary inline-block text-sm">

            Go to Login

          </Link>
        </div>
      </AuthPageLayout>
    );

  }



  return (
    <AuthPageLayout maxWidth="max-w-lg">
      <div className="text-center mb-3 sm:mb-5">
        <AuthPageLogo className="mb-3 sm:mb-4" />
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Doctor Admin Setup</h1>

          <p className="text-gray-500 mt-1 text-sm sm:text-base">

            One-time setup for the clinic doctor account

          </p>

        </div>



        <div className="card">

          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={loading} className="space-y-4 border-0 p-0 m-0 min-w-0">

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Setup Key</label>

              <PasswordInput
                name="setupKey"
                icon={KeyRound}
                iconClassName="w-5 h-5"
                inputClassName="input-field pl-10 pr-11"
                placeholder="From server ADMIN_SETUP_SECRET"
                value={form.setupKey}
                onChange={handleChange}
                required
              />

            </div>



            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>

              <div className="relative">

                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input name="name" className="input-field pl-10" placeholder="Dr. Priya Sharma" value={form.name} onChange={handleChange} required />

              </div>

            </div>



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>

                <div className="relative">

                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <input name="email" type="email" className="input-field pl-10" placeholder="doctor@clinic.com" value={form.email} onChange={handleChange} required />

                </div>

              </div>

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>

                <div className="relative">

                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <input name="phone" className="input-field pl-10" placeholder="9876543210" value={form.phone} onChange={handleChange} required />

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



            <div className="border-t border-gray-100 pt-4">

              <div className="flex items-center gap-2 mb-4">

                <Stethoscope className="w-5 h-5 text-[#a8841f]" />

                <span className="font-medium text-gray-900">Doctor Profile</span>

              </div>

            </div>



            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>

              <input name="specialization" className="input-field" placeholder="e.g. Panchakarma Specialist" value={form.specialization} onChange={handleChange} />

            </div>



            <div className="grid grid-cols-2 gap-4">

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>

                <input name="experience" type="number" className="input-field" placeholder="5" value={form.experience} onChange={handleChange} />

              </div>

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">Fee (₹)</label>

                <input name="consultationFee" type="number" className="input-field" placeholder="500" value={form.consultationFee} onChange={handleChange} />

              </div>

            </div>



            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>

              <textarea name="bio" className="input-field" rows={3} placeholder="Brief about your practice..." value={form.bio} onChange={handleChange} />

            </div>



            <button type="submit" className="btn-primary w-full !py-3">

              {loading ? 'Creating account...' : 'Create Doctor Admin Account'}

            </button>

            </fieldset>

          </form>



          <p className="text-center text-sm text-gray-500 mt-6">

            Already set up?{' '}

            <Link to="/login" className="text-primary-600 font-medium hover:underline">

              Sign in

            </Link>

          </p>

        </div>

    </AuthPageLayout>
  );
}


