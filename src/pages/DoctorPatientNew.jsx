import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../constants/routes';

export default function DoctorPatientNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    allergies: '',
    alerts: '',
    medicalHistory: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/patients', form);
      toast.success(`Patient added · ${res.data.patient.patientCode || ''}`);
      navigate(ROUTES.doctorPatientDetail(res.data.patient._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add patient.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <form onSubmit={handleSubmit} className="card max-w-3xl">
        <fieldset disabled={loading} className="space-y-4 border-0 p-0 m-0">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">First name *</label>
              <input
                name="firstName"
                className="input-field"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label-field">Last name</label>
              <input name="lastName" className="input-field" value={form.lastName} onChange={handleChange} />
            </div>
            <div>
              <label className="label-field">Phone *</label>
              <input name="phone" className="input-field" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <label className="label-field">Email</label>
              <input
                name="email"
                type="email"
                className="input-field"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label-field">Date of birth</label>
              <input
                name="dateOfBirth"
                type="date"
                className="input-field"
                value={form.dateOfBirth}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label-field">Gender</label>
              <select name="gender" className="input-field" value={form.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">Allergies</label>
            <input
              name="allergies"
              className="input-field"
              placeholder="Comma-separated"
              value={form.allergies}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label-field">Important alerts</label>
            <input
              name="alerts"
              className="input-field"
              placeholder="e.g. Fall risk, Pregnancy"
              value={form.alerts}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label-field">Medical notes</label>
            <textarea
              name="medicalHistory"
              className="input-field"
              rows={3}
              value={form.medicalHistory}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" className="btn-primary">
              {loading ? 'Saving...' : 'Save patient'}
            </button>
            <Link to={ROUTES.doctorPatients} className="btn-secondary">
              Cancel
            </Link>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
