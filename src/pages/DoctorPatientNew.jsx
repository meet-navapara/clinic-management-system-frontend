import { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import { normalizeIndianMobile, isValidEmail } from '../utils/validation';

const RELATIONS = [
  'Father',
  'Mother',
  'Spouse',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Guardian',
  'Friend',
  'Other',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const DEFAULT_HISTORY_TAGS = [
  'Vertigo',
  'Active Smoker',
  'Alcohol problem',
  'Allergic to Diclofenac',
  'Allergic to Milk Products',
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Thyroid disorder',
];

const EMPTY_FORM = {
  firstName: '',
  middleName: '',
  lastName: '',
  phone: '',
  gender: '',
  address: '',
  city: 'Surat',
  area: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  profilePhoto: '',
  secondaryPhone: '',
  email: '',
  age: '',
  dateOfBirth: '',
  nhId: '',
  referredBy: '',
  patientCategory: 'Patient',
  linkedPatientName: '',
  caseId: '',
  aadharNumber: '',
  sendSms: true,
  admitPatient: false,
  room: '',
  bloodGroup: '',
  historyTags: [],
  otherHistory: '',
  occupation: '',
  doctorId: '',
};

function todayInput() {
  return format(new Date(), 'yyyy-MM-dd');
}

export default function DoctorPatientNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (user?.role === 'doctor') return;
    api
      .get('/doctors')
      .then((res) => setDoctors(res.data.doctors || res.data || []))
      .catch(() => {});
  }, [user]);

  const historyOptions = useMemo(() => {
    const merged = [...new Set([...DEFAULT_HISTORY_TAGS, ...form.historyTags])];
    const q = historyFilter.trim().toLowerCase();
    if (!q) return merged;
    return merged.filter((t) => t.toLowerCase().includes(q));
  }, [form.historyTags, historyFilter]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setField(name, type === 'checkbox' ? checked : value);
  };

  const toggleHistoryTag = (tag) => {
    setForm((prev) => {
      const exists = prev.historyTags.includes(tag);
      return {
        ...prev,
        historyTags: exists
          ? prev.historyTags.filter((t) => t !== tag)
          : [...prev.historyTags, tag],
      };
    });
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (!tag) return;
    setForm((prev) => ({
      ...prev,
      historyTags: prev.historyTags.includes(tag) ? prev.historyTags : [...prev.historyTags, tag],
    }));
    setCustomTag('');
    setHistoryFilter('');
  };

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile image must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField('profilePhoto', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required.';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
    const phone = normalizeIndianMobile(form.phone);
    if (!phone) errors.phone = 'Contact number must be a valid 10-digit Indian mobile (+91).';
    if (!form.gender) errors.gender = 'Gender is required.';
    if (form.email && !isValidEmail(form.email)) errors.email = 'Email address is invalid.';
    if (form.secondaryPhone && !normalizeIndianMobile(form.secondaryPhone)) {
      errors.secondaryPhone = 'Secondary number must be a valid 10-digit Indian mobile.';
    }
    if (form.emergencyContactPhone && !normalizeIndianMobile(form.emergencyContactPhone)) {
      errors.emergencyContactPhone = 'Relative contact must be a valid 10-digit Indian mobile.';
    }
    if (form.aadharNumber && !/^\d{12}$/.test(form.aadharNumber.trim())) {
      errors.aadharNumber = 'Aadhar number must be 12 digits.';
    }
    if (form.dateOfBirth) {
      const d = new Date(form.dateOfBirth);
      if (Number.isNaN(d.getTime()) || d > new Date()) {
        errors.dateOfBirth = 'Date of birth cannot be in the future.';
      }
    }
    if (user?.role !== 'doctor' && !form.doctorId) errors.doctorId = 'Assigned doctor is required.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      const firstKey = Object.keys(errors)[0];
      document.getElementById(`patient-${firstKey}`)?.focus();
      toast.error(errors[firstKey]);
      return null;
    }

    return {
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      phone,
      gender: form.gender,
      address: form.address.trim(),
      city: form.city.trim(),
      area: form.area.trim(),
      emergencyContactName: form.emergencyContactName.trim(),
      emergencyContactPhone: form.emergencyContactPhone
        ? normalizeIndianMobile(form.emergencyContactPhone)
        : '',
      emergencyContactRelationship: form.emergencyContactRelationship,
      profilePhoto: form.profilePhoto,
      secondaryPhone: form.secondaryPhone
        ? normalizeIndianMobile(form.secondaryPhone)
        : '',
      email: form.email.trim(),
      age: form.age === '' ? undefined : Number(form.age),
      dateOfBirth: form.dateOfBirth || undefined,
      nhId: form.nhId.trim(),
      referredBy: form.referredBy.trim(),
      patientCategory: form.patientCategory,
      linkedPatientName: form.linkedPatientName.trim(),
      caseId: form.caseId.trim(),
      aadharNumber: form.aadharNumber.trim(),
      sendSms: form.sendSms,
      admitPatient: form.admitPatient,
      room: form.room.trim(),
      bloodGroup: form.bloodGroup,
      historyTags: form.historyTags,
      conditions: form.historyTags,
      otherHistory: form.otherHistory.trim(),
      medicalHistory: form.otherHistory.trim(),
      occupation: form.occupation.trim(),
      doctorId: form.doctorId || undefined,
    };
  };

  const savePatient = async (after = 'profile') => {
    const payload = validate();
    if (!payload) return;
    setLoading(true);
    try {
      const res = await api.post('/patients', payload);
      const patient = res.data.patient;
      toast.success(`Patient created successfully · ${patient.patientCode || ''}`);
      if (after === 'list') {
        navigate(ROUTES.doctorPatients);
      } else if (after === 'book') {
        navigate(`${ROUTES.doctorBook}?patientId=${patient._id}`);
      } else if (after === 'consent') {
        navigate(`${ROUTES.consent}?patientId=${patient._id}`);
      } else {
        navigate(ROUTES.doctorPatientDetail(patient._id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create patient.');
      if (err.response?.data?.errors) setFieldErrors(err.response.data.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-6xl">
      <div className="mb-4">
        <h1 className="page-title">Patient Registration</h1>
        <p className="text-sm text-ink-muted mt-1">Capture full patient details for clinical records.</p>
      </div>

      <form
        className="card space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          savePatient('profile');
        }}
      >
        <fieldset disabled={loading} className="space-y-5 border-0 p-0 m-0 min-w-0">
          {/* Name */}
          <div>
            <p className="label-field mb-2">
              Name <span className="text-red-600">*</span>
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <input
                  id="patient-firstName"
                  name="firstName"
                  className="input-field"
                  placeholder="First Name (required)"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.firstName && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.firstName}</p>
                )}
              </div>
              <input
                id="patient-middleName"
                name="middleName"
                className="input-field"
                placeholder="Middle Name (optional)"
                value={form.middleName}
                onChange={handleChange}
              />
              <div>
                <input
                  id="patient-lastName"
                  name="lastName"
                  className="input-field"
                  placeholder="Last Name (required)"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.lastName && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="patient-phone" className="label-field">
                    Contact No. <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="patient-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    className="input-field"
                    placeholder="+91 9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
                <div>
                  <p className="label-field mb-2">
                    Gender <span className="text-red-600">*</span>
                  </p>
                  <div className="flex flex-wrap gap-4 min-h-10 items-center">
                    {['male', 'female'].map((g) => (
                      <label key={g} className="inline-flex items-center gap-2 text-sm capitalize cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={form.gender === g}
                          onChange={handleChange}
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                  {fieldErrors.gender && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.gender}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="patient-address" className="label-field">
                  Address
                </label>
                <div className="grid sm:grid-cols-3 gap-3">
                  <textarea
                    id="patient-address"
                    name="address"
                    className="input-field sm:col-span-1"
                    rows={2}
                    placeholder="Street / landmark"
                    value={form.address}
                    onChange={handleChange}
                  />
                  <input
                    id="patient-city"
                    name="city"
                    className="input-field"
                    placeholder="City"
                    value={form.city}
                    onChange={handleChange}
                  />
                  <input
                    id="patient-area"
                    name="area"
                    className="input-field"
                    placeholder="Select Area"
                    value={form.area}
                    onChange={handleChange}
                    list="patient-area-list"
                  />
                  <datalist id="patient-area-list">
                    <option value="Adajan" />
                    <option value="Vesu" />
                    <option value="Athwa" />
                    <option value="Katargam" />
                    <option value="Varachha" />
                    <option value="Piplod" />
                  </datalist>
                </div>
              </div>

              <div>
                <p className="section-label mb-2">Relative&apos;s Information</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="patient-emergencyContactName" className="label-field">
                      Name
                    </label>
                    <input
                      id="patient-emergencyContactName"
                      name="emergencyContactName"
                      className="input-field"
                      value={form.emergencyContactName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="patient-emergencyContactPhone" className="label-field">
                      Contact
                    </label>
                    <input
                      id="patient-emergencyContactPhone"
                      name="emergencyContactPhone"
                      type="tel"
                      className="input-field"
                      value={form.emergencyContactPhone}
                      onChange={handleChange}
                    />
                    {fieldErrors.emergencyContactPhone && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.emergencyContactPhone}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="patient-emergencyContactRelationship" className="label-field">
                      Relation
                    </label>
                    <select
                      id="patient-emergencyContactRelationship"
                      name="emergencyContactRelationship"
                      className="input-field"
                      value={form.emergencyContactRelationship}
                      onChange={handleChange}
                    >
                      <option value="">Select Relation</option>
                      {RELATIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="label-field mb-2">Profile Image</p>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-[#efeae2] overflow-hidden flex items-center justify-center ring-1 ring-line">
                      {form.profilePhoto ? (
                        <img src={form.profilePhoto} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="w-5 h-5 text-ink-faint" aria-hidden />
                      )}
                    </div>
                    <div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                      <button
                        type="button"
                        className="btn-secondary !min-h-9"
                        onClick={() => fileRef.current?.click()}
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div>
                    <label htmlFor="patient-secondaryPhone" className="label-field">
                      Secondary No.
                    </label>
                    <input
                      id="patient-secondaryPhone"
                      name="secondaryPhone"
                      type="tel"
                      className="input-field"
                      value={form.secondaryPhone}
                      onChange={handleChange}
                    />
                    {fieldErrors.secondaryPhone && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.secondaryPhone}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="patient-email" className="label-field">
                      Email Id
                    </label>
                    <input
                      id="patient-email"
                      name="email"
                      type="email"
                      className="input-field"
                      value={form.email}
                      onChange={handleChange}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="patient-age" className="label-field">
                    Age
                  </label>
                  <input
                    id="patient-age"
                    name="age"
                    type="number"
                    min="0"
                    max="150"
                    className="input-field"
                    placeholder="In Years"
                    value={form.age}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="patient-dateOfBirth" className="label-field">
                    DOB
                  </label>
                  <input
                    id="patient-dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    className="input-field"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    max={todayInput()}
                  />
                  {fieldErrors.dateOfBirth && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.dateOfBirth}</p>
                  )}
                </div>
                <div>
                  <label className="label-field">Creation date</label>
                  <input className="input-field" value={format(new Date(), 'dd-MM-yyyy')} readOnly />
                </div>
                <div>
                  <label htmlFor="patient-nhId" className="label-field">
                    NH ID
                  </label>
                  <input
                    id="patient-nhId"
                    name="nhId"
                    className="input-field"
                    placeholder="Enter NH ID"
                    value={form.nhId}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="patient-referredBy" className="label-field">
                    Referred By
                  </label>
                  <input
                    id="patient-referredBy"
                    name="referredBy"
                    className="input-field"
                    placeholder="Doctor Name"
                    value={form.referredBy}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="patient-patientCategory" className="label-field">
                    Patient Link
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      id="patient-patientCategory"
                      name="patientCategory"
                      className="input-field"
                      value={form.patientCategory}
                      onChange={handleChange}
                    >
                      <option value="Patient">Patient</option>
                      <option value="Family">Family</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                    <input
                      id="patient-linkedPatientName"
                      name="linkedPatientName"
                      className="input-field"
                      placeholder="Patient Name"
                      value={form.linkedPatientName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="patient-caseId" className="label-field">
                    Case Id
                  </label>
                  <input
                    id="patient-caseId"
                    name="caseId"
                    className="input-field"
                    placeholder="Case Id"
                    value={form.caseId}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="patient-aadharNumber" className="label-field">
                    Aadhar Card
                  </label>
                  <input
                    id="patient-aadharNumber"
                    name="aadharNumber"
                    className="input-field"
                    placeholder="Enter aadhar card no."
                    value={form.aadharNumber}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength={12}
                  />
                  {fieldErrors.aadharNumber && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.aadharNumber}</p>
                  )}
                </div>
              </div>

              {user?.role !== 'doctor' && (
                <div>
                  <label htmlFor="patient-doctorId" className="label-field">
                    Assigned doctor <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="patient-doctorId"
                    name="doctorId"
                    className="input-field"
                    value={form.doctorId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((d) => (
                      <option key={d._id || d.id} value={d._id || d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.doctorId && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.doctorId}</p>
                  )}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name="sendSms"
                    checked={form.sendSms}
                    onChange={handleChange}
                  />
                  Send SMS
                </label>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name="admitPatient"
                    checked={form.admitPatient}
                    onChange={handleChange}
                  />
                  Admit this patient
                </label>
              </div>

              <div>
                <label htmlFor="patient-room" className="label-field">
                  Room
                </label>
                <select
                  id="patient-room"
                  name="room"
                  className="input-field"
                  value={form.room}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="OPD">OPD</option>
                  <option value="Room 1">Room 1</option>
                  <option value="Room 2">Room 2</option>
                  <option value="Room 3">Room 3</option>
                  <option value="Ward">Ward</option>
                </select>
              </div>

              <div>
                <label htmlFor="patient-bloodGroup" className="label-field">
                  Blood Group
                </label>
                <select
                  id="patient-bloodGroup"
                  name="bloodGroup"
                  className="input-field"
                  value={form.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select Blood Group</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="label-field mb-2">Medical History</p>
                <input
                  className="input-field mb-2"
                  placeholder="Type to filter or add new"
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                />
                <div className="max-h-40 overflow-y-auto rounded-lg border border-line bg-white p-2 space-y-1">
                  {historyOptions.map((tag) => (
                    <label key={tag} className="flex items-center gap-2 text-sm px-1 py-1 cursor-pointer hover:bg-[#f7f4ef] rounded">
                      <input
                        type="checkbox"
                        checked={form.historyTags.includes(tag)}
                        onChange={() => toggleHistoryTag(tag)}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    className="input-field"
                    placeholder="Add custom history"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                  />
                  <button type="button" className="btn-secondary shrink-0" onClick={addCustomTag}>
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="patient-otherHistory" className="label-field">
                  Other History
                </label>
                <textarea
                  id="patient-otherHistory"
                  name="otherHistory"
                  className="input-field"
                  rows={3}
                  value={form.otherHistory}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="patient-occupation" className="label-field">
                  Occupation
                </label>
                <input
                  id="patient-occupation"
                  name="occupation"
                  className="input-field"
                  value={form.occupation}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-line flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-10 px-3 rounded-md text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
              disabled={loading}
              onClick={() => savePatient('profile')}
            >
              Add Patient & Print Registration Form
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-10 px-3 rounded-md text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
              disabled={loading}
              onClick={() => savePatient('consent')}
            >
              Add Patient & Print Consent Form
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Add Patient'}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-10 px-3 rounded-md text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50"
              disabled={loading}
              onClick={() => savePatient('profile')}
            >
              Add Patient & Print Sticker
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-10 px-3 rounded-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              disabled={loading}
              onClick={() => savePatient('profile')}
            >
              Add Patient and Go to Profile
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-10 px-3 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              disabled={loading}
              onClick={() => savePatient('book')}
            >
              Add Patient & Book Appointment
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
