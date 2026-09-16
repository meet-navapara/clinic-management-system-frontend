import { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import {
  normalizeIndianMobile,
  isValidEmail,
  formatIndianMobileInput,
  digitsOnly,
  ageFromDob,
} from '../utils/validation';
import {
  PATIENT_RELATIONS,
  PATIENT_BLOOD_GROUPS,
  PATIENT_CITIES,
  PATIENT_CATEGORIES,
  PATIENT_GENDERS,
  DEFAULT_HISTORY_TAGS,
} from '../constants/patientForm';
import Dropdown from '../components/ui/Dropdown';
import DobDatepicker from '../components/DobDatepicker';
import Checkbox from '../components/ui/Checkbox';
import RequiredMark from '../components/ui/RequiredMark';
import { compressImageToDataUrl } from '../utils/image';

const FALLBACK_ROOMS = ['OPD', 'Room 1', 'Room 2', 'Room 3', 'Ward'];

function Field({ id, label, required, error, className = '', children }) {
  return (
    <div className={`min-w-0 w-full flex flex-col ${className}`}>
      {label != null && (
        <label htmlFor={id} className="label-field">
          {label}
          {required ? <> <RequiredMark /></> : null}
        </label>
      )}
      <div className="min-w-0 w-full">{children}</div>
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}

/** Occupation: letters / spaces / basic punctuation — not a digit dump. */
function formatOccupationInput(raw) {
  return String(raw || '')
    .replace(/[0-9]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 80);
}

/** Case Id: short alphanumeric code. */
function formatCaseIdInput(raw) {
  return String(raw || '')
    .replace(/[^a-zA-Z0-9\-_/]/g, '')
    .slice(0, 24);
}

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

export default function DoctorPatientNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { branches, current } = useBranch();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);

  const roomOptions = useMemo(() => {
    const fromBranches = branches.flatMap((b) => {
      const list = Array.isArray(b.rooms) && b.rooms.length ? b.rooms : [];
      if (list.length) return list;
      return b.roomLabel ? [b.roomLabel] : [];
    });
    const unique = [...new Set(fromBranches.map((r) => String(r || '').trim()).filter(Boolean))];
    if (unique.length) return unique;
    return FALLBACK_ROOMS;
  }, [branches]);

  useEffect(() => {
    if (!form.room && current?.roomLabel) {
      setForm((prev) => (prev.room ? prev : { ...prev, room: current.roomLabel }));
    }
  }, [current?.roomLabel]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handlePhoneChange = (name) => (e) => {
    setField(name, formatIndianMobileInput(e.target.value));
  };

  const handlePhoneKeyDown = (name) => (e) => {
    if (e.key !== 'Backspace') return;
    const v = form[name] || '';
    const localDigits = v.replace(/^\s*\+?\s*91[\s-]*/i, '').replace(/\D/g, '');
    if (localDigits.length <= 1) {
      e.preventDefault();
      setField(name, '');
    }
  };

  const handleAadharChange = (e) => {
    setField('aadharNumber', digitsOnly(e.target.value, 12));
  };

  const handleAgeChange = (e) => {
    const raw = digitsOnly(e.target.value, 3);
    if (raw === '') {
      setField('age', '');
      return;
    }
    const n = Math.min(150, Number(raw));
    setField('age', String(Number.isFinite(n) ? n : ''));
  };

  const handleDobChange = (value) => {
    const derived = ageFromDob(value);
    setForm((prev) => ({
      ...prev,
      dateOfBirth: value,
      ...(derived != null ? { age: String(derived) } : {}),
    }));
    setFieldErrors((prev) => ({ ...prev, dateOfBirth: undefined, age: undefined }));
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
    const tag = customTag.trim().slice(0, 80);
    if (!tag) return;
    setForm((prev) => ({
      ...prev,
      historyTags: prev.historyTags.includes(tag) ? prev.historyTags : [...prev.historyTags, tag],
    }));
    setCustomTag('');
    setHistoryFilter('');
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Profile image must be under 8MB.');
      return;
    }
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setField('profilePhoto', dataUrl);
    } catch {
      toast.error('Could not process image.');
    }
  };

  const validate = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required.';
    else if (form.firstName.trim().length > 80) errors.firstName = 'First name is too long.';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
    else if (form.lastName.trim().length > 80) errors.lastName = 'Last name is too long.';
    if (form.middleName.trim().length > 80) errors.middleName = 'Middle name is too long.';

    const phone = normalizeIndianMobile(form.phone);
    if (!phone) errors.phone = 'Enter a valid 10-digit mobile number.';

    if (!form.gender) errors.gender = 'Gender is required.';

    if (form.email && !isValidEmail(form.email)) errors.email = 'Email address is invalid.';

    if (form.secondaryPhone && !normalizeIndianMobile(form.secondaryPhone)) {
      errors.secondaryPhone = 'Secondary number must be exactly 10 digits.';
    }
    if (form.emergencyContactPhone && !normalizeIndianMobile(form.emergencyContactPhone)) {
      errors.emergencyContactPhone = 'Relative contact must be exactly 10 digits.';
    }

    if (form.aadharNumber && !/^\d{12}$/.test(form.aadharNumber)) {
      errors.aadharNumber = 'Aadhar number must be exactly 12 digits.';
    }

    if (form.city && !PATIENT_CITIES.includes(form.city)) {
      errors.city = 'Select a city from the list.';
    }
    if (form.area.trim().length > 80) errors.area = 'Area is too long.';

    if (form.bloodGroup && !PATIENT_BLOOD_GROUPS.includes(form.bloodGroup)) {
      errors.bloodGroup = 'Select a valid blood group.';
    }
    if (form.room && !roomOptions.includes(form.room)) {
      errors.room = 'Select a room from clinic branch settings.';
    }
    if (form.patientCategory && !PATIENT_CATEGORIES.includes(form.patientCategory)) {
      errors.patientCategory = 'Invalid patient category.';
    }
    if (
      form.emergencyContactRelationship &&
      !PATIENT_RELATIONS.includes(form.emergencyContactRelationship)
    ) {
      errors.emergencyContactRelationship = 'Select a relation from the list.';
    }

    if (form.admitPatient && !form.room) {
      errors.room = 'Select a room when admitting the patient.';
    }

    if (form.dateOfBirth) {
      const d = new Date(form.dateOfBirth);
      if (Number.isNaN(d.getTime()) || d > new Date()) {
        errors.dateOfBirth = 'Date of birth cannot be in the future.';
      } else if (d.getFullYear() < 1900) {
        errors.dateOfBirth = 'Date of birth is too far in the past.';
      }
    }

    if (form.age !== '') {
      const ageNum = Number(form.age);
      if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 150) {
        errors.age = 'Age must be between 0 and 150.';
      }
    }

    if (form.occupation && /[0-9]/.test(form.occupation)) {
      errors.occupation = 'Occupation cannot contain numbers.';
    }
    if (form.caseId && form.caseId.length > 24) {
      errors.caseId = 'Case Id must be at most 24 characters.';
    }

    if (form.address.length > 500) errors.address = 'Address is too long.';
    if (form.nhId.trim().length > 40) errors.nhId = 'NH ID is too long.';
    if (form.referredBy.trim().length > 120) errors.referredBy = 'Referred by is too long.';
    if (form.otherHistory.trim().length > 500) errors.otherHistory = 'Other history is too long.';
    if (form.linkedPatientName.trim().length > 120) {
      errors.linkedPatientName = 'Linked patient name is too long.';
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
      emergencyContactName: form.emergencyContactName.trim().slice(0, 80),
      emergencyContactPhone: form.emergencyContactPhone
        ? normalizeIndianMobile(form.emergencyContactPhone)
        : '',
      emergencyContactRelationship: form.emergencyContactRelationship,
      profilePhoto: form.profilePhoto,
      secondaryPhone: form.secondaryPhone ? normalizeIndianMobile(form.secondaryPhone) : '',
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
    <div className="page-container">
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
        <fieldset
          disabled={loading}
          className="space-y-5 border-0 p-0 m-0 min-w-0 [&_input.input-field]:h-10 [&_input.input-field]:min-h-10 [&_input.input-field]:py-0 [&_button.input-field]:h-10 [&_button.input-field]:min-h-10 [&_button.input-field]:py-0"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            <div className="lg:col-span-2 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-4 items-start">
              <p className="label-field sm:col-span-2 mb-0">
                Name <RequiredMark />
              </p>
              <div className="sm:col-span-2 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-4">
                <Field id="patient-firstName" error={fieldErrors.firstName}>
                  <input
                    id="patient-firstName"
                    name="firstName"
                    className="input-field w-full"
                    placeholder="First Name (required)"
                    value={form.firstName}
                    onChange={handleChange}
                    maxLength={80}
                    autoComplete="given-name"
                    required
                  />
                </Field>
                <Field id="patient-middleName" error={fieldErrors.middleName}>
                  <input
                    id="patient-middleName"
                    name="middleName"
                    className="input-field w-full"
                    placeholder="Middle Name (optional)"
                    value={form.middleName}
                    onChange={handleChange}
                    maxLength={80}
                    autoComplete="additional-name"
                  />
                </Field>
                <Field id="patient-lastName" error={fieldErrors.lastName}>
                  <input
                    id="patient-lastName"
                    name="lastName"
                    className="input-field w-full"
                    placeholder="Last Name (required)"
                    value={form.lastName}
                    onChange={handleChange}
                    maxLength={80}
                    autoComplete="family-name"
                    required
                  />
                </Field>
              </div>

              <Field id="patient-phone" label="Contact No." required error={fieldErrors.phone}>
                <input
                  id="patient-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  className="input-field w-full"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={handlePhoneChange('phone')}
                  onKeyDown={handlePhoneKeyDown('phone')}
                  maxLength={10}
                  required
                />
              </Field>
              <Field id="patient-gender" label="Gender" required error={fieldErrors.gender}>
                <Dropdown
                  id="patient-gender"
                  value={form.gender}
                  onChange={(value) => setField('gender', value)}
                  options={PATIENT_GENDERS}
                  placeholder="Select Gender"
                  required
                  ariaLabel="Gender"
                />
              </Field>
              <Field label="Profile Image">
                <div className="flex items-center gap-2 h-10">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[#efeae2] overflow-hidden flex items-center justify-center ring-1 ring-line">
                    {form.profilePhoto ? (
                      <img src={form.profilePhoto} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="w-4 h-4 text-ink-faint" aria-hidden />
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                  <button
                    type="button"
                    className="btn-secondary grow"
                    onClick={() => fileRef.current?.click()}
                  >
                    Upload
                  </button>
                  {form.profilePhoto ? (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setField('profilePhoto', '')}>
                      Remove
                    </button>
                  ) : null}
                </div>
              </Field>

              <Field id="patient-address" label="Address" error={fieldErrors.address}>
                <input
                  id="patient-address"
                  name="address"
                  className="input-field w-full"
                  placeholder="Street / landmark"
                  value={form.address}
                  onChange={handleChange}
                  maxLength={500}
                />
              </Field>
              <Field id="patient-city" label="City" error={fieldErrors.city}>
                <Dropdown
                  id="patient-city"
                  value={form.city}
                  onChange={(value) => setField('city', value)}
                  options={PATIENT_CITIES}
                  placeholder="Select City"
                  ariaLabel="City"
                  searchable
                  searchPlaceholder="Search Gujarat city"
                />
              </Field>
              <Field id="patient-area" label="Area" error={fieldErrors.area}>
                <input
                  id="patient-area"
                  name="area"
                  className="input-field w-full"
                  placeholder="e.g. Adajan, Vesu"
                  value={form.area}
                  onChange={handleChange}
                  maxLength={80}
                />
              </Field>

              <p className="section-label sm:col-span-2 mb-0 mt-1">Relative&apos;s Information</p>
              <Field id="patient-emergencyContactName" label="Name">
                <input
                  id="patient-emergencyContactName"
                  name="emergencyContactName"
                  className="input-field w-full"
                  value={form.emergencyContactName}
                  onChange={handleChange}
                  maxLength={80}
                />
              </Field>
              <Field id="patient-emergencyContactPhone" label="Contact" error={fieldErrors.emergencyContactPhone}>
                <input
                  id="patient-emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  inputMode="numeric"
                  className="input-field w-full"
                  placeholder="9876543210"
                  value={form.emergencyContactPhone}
                  onChange={handlePhoneChange('emergencyContactPhone')}
                  onKeyDown={handlePhoneKeyDown('emergencyContactPhone')}
                  maxLength={10}
                />
              </Field>
              <Field id="patient-emergencyContactRelationship" label="Relation" error={fieldErrors.emergencyContactRelationship}>
                <Dropdown
                  id="patient-emergencyContactRelationship"
                  value={form.emergencyContactRelationship}
                  onChange={(value) => setField('emergencyContactRelationship', value)}
                  options={PATIENT_RELATIONS}
                  placeholder="Select Relation"
                  ariaLabel="Relation"
                />
              </Field>

              <Field id="patient-secondaryPhone" label="Secondary No." error={fieldErrors.secondaryPhone}>
                <input
                  id="patient-secondaryPhone"
                  name="secondaryPhone"
                  type="tel"
                  inputMode="numeric"
                  className="input-field w-full"
                  placeholder="9876543210"
                  value={form.secondaryPhone}
                  onChange={handlePhoneChange('secondaryPhone')}
                  onKeyDown={handlePhoneKeyDown('secondaryPhone')}
                  maxLength={10}
                />
              </Field>
              <Field id="patient-email" label="Email Id" error={fieldErrors.email}>
                <input
                  id="patient-email"
                  name="email"
                  type="email"
                  className="input-field w-full"
                  value={form.email}
                  onChange={handleChange}
                  maxLength={120}
                  autoComplete="email"
                />
              </Field>
              <Field id="patient-age" label="Age" error={fieldErrors.age}>
                <input
                  id="patient-age"
                  name="age"
                  type="text"
                  inputMode="numeric"
                  className="input-field w-full"
                  placeholder="In Years (0–150)"
                  value={form.age}
                  onChange={handleAgeChange}
                  maxLength={3}
                />
              </Field>

              <Field id="patient-dateOfBirth" label="DOB" error={fieldErrors.dateOfBirth}>
                <DobDatepicker id="patient-dateOfBirth" value={form.dateOfBirth} onChange={handleDobChange} />
              </Field>
              <Field label="Creation date">
                <input className="input-field w-full" value={format(new Date(), 'dd-MM-yyyy')} readOnly />
              </Field>
              <Field id="patient-nhId" label="NH ID" error={fieldErrors.nhId}>
                <input
                  id="patient-nhId"
                  name="nhId"
                  className="input-field w-full"
                  placeholder="Enter NH ID"
                  value={form.nhId}
                  onChange={handleChange}
                  maxLength={40}
                />
              </Field>

              <Field id="patient-referredBy" label="Referred By" error={fieldErrors.referredBy}>
                <input
                  id="patient-referredBy"
                  name="referredBy"
                  className="input-field w-full"
                  placeholder="Doctor Name"
                  value={form.referredBy}
                  onChange={handleChange}
                  maxLength={120}
                />
              </Field>
              <Field id="patient-patientCategory" label="Patient Link" error={fieldErrors.patientCategory}>
                <Dropdown
                  id="patient-patientCategory"
                  value={form.patientCategory}
                  onChange={(value) => setField('patientCategory', value)}
                  options={PATIENT_CATEGORIES}
                  placeholder="Select"
                  ariaLabel="Patient link"
                />
              </Field>
              <Field id="patient-linkedPatientName" label="Linked Patient" error={fieldErrors.linkedPatientName}>
                <input
                  id="patient-linkedPatientName"
                  name="linkedPatientName"
                  className="input-field w-full"
                  placeholder="Patient Name"
                  value={form.linkedPatientName}
                  onChange={handleChange}
                  maxLength={120}
                />
              </Field>

              <Field id="patient-caseId" label="Case Id" error={fieldErrors.caseId}>
                <input
                  id="patient-caseId"
                  name="caseId"
                  className="input-field w-full"
                  placeholder="e.g. CASE-1024"
                  value={form.caseId}
                  onChange={(e) => setField('caseId', formatCaseIdInput(e.target.value))}
                  maxLength={24}
                />
              </Field>
              <Field id="patient-aadharNumber" label="Aadhar Card" error={fieldErrors.aadharNumber}>
                <input
                  id="patient-aadharNumber"
                  name="aadharNumber"
                  className="input-field w-full"
                  placeholder="12-digit Aadhar"
                  value={form.aadharNumber}
                  onChange={handleAadharChange}
                  inputMode="numeric"
                  maxLength={12}
                />
              </Field>
              <Field id="patient-occupation" label="Occupation" error={fieldErrors.occupation}>
                <input
                  id="patient-occupation"
                  name="occupation"
                  className="input-field w-full"
                  placeholder="e.g. Teacher, Engineer"
                  value={form.occupation}
                  onChange={(e) => setField('occupation', formatOccupationInput(e.target.value))}
                  maxLength={80}
                />
              </Field>
              {user?.role !== 'doctor' ? (
                <Field id="patient-doctorId" label="Assigned doctor" required error={fieldErrors.doctorId}>
                  <Dropdown
                    id="patient-doctorId"
                    value={form.doctorId}
                    onChange={(value) => setField('doctorId', value)}
                    options={doctors.map((d) => ({
                      value: String(d._id || d.id),
                      label: d.name,
                    }))}
                    placeholder="Select doctor"
                    required
                    ariaLabel="Assigned doctor"
                  />
                </Field>
              ) : null}

              <Field label="SMS" className="sm:col-start-1 lg:col-start-1">
                <Checkbox name="sendSms" checked={form.sendSms} onChange={handleChange}>
                  Send SMS to patient
                </Checkbox>
              </Field>
              <Field label="Admission">
                <Checkbox name="admitPatient" checked={form.admitPatient} onChange={handleChange}>
                  Admit this patient
                </Checkbox>
              </Field>
              <Field id="patient-room" label="Room" required={form.admitPatient} error={fieldErrors.room}>
                <Dropdown
                  id="patient-room"
                  value={form.room}
                  onChange={(value) => setField('room', value)}
                  options={roomOptions}
                  placeholder="Select room"
                  ariaLabel="Room"
                />
                <p className="text-[11px] text-ink-faint mt-1">
                  From branch settings (Branches → Room label)
                  {current?.roomLabel ? ` · current: ${current.roomLabel}` : ''}
                </p>
              </Field>

              <Field id="patient-bloodGroup" label="Blood Group" error={fieldErrors.bloodGroup}>
                <Dropdown
                  id="patient-bloodGroup"
                  value={form.bloodGroup}
                  onChange={(value) => setField('bloodGroup', value)}
                  options={PATIENT_BLOOD_GROUPS}
                  placeholder="Select Blood Group"
                  ariaLabel="Blood group"
                />
              </Field>
              <Field id="patient-otherHistory" label="Other History" error={fieldErrors.otherHistory}>
                <input
                  id="patient-otherHistory"
                  name="otherHistory"
                  className="input-field w-full"
                  value={form.otherHistory}
                  onChange={handleChange}
                  maxLength={500}
                />
              </Field>
            </div>

            <aside className="min-w-0 lg:sticky lg:top-4">
              <div className="rounded-xl border border-line bg-[#faf8f3] p-4 space-y-3">
                <p className="section-label mb-0">Medical History</p>
                <Field label="Filter">
                  <input
                    className="input-field w-full"
                    placeholder="Type to filter"
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                  />
                </Field>
                <Field label="Custom tag">
                  <div className="flex gap-2 min-w-0">
                    <input
                      className="input-field w-full min-w-0 grow"
                      placeholder="Add custom history"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value.slice(0, 80))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomTag();
                        }
                      }}
                      maxLength={80}
                    />
                    <button type="button" className="btn-secondary shrink-0" onClick={addCustomTag}>
                      Add
                    </button>
                  </div>
                </Field>
                <div className="max-h-72 overflow-y-auto rounded-lg border border-line bg-white p-3 flex flex-wrap gap-2">
                  {historyOptions.map((tag) => (
                    <Checkbox
                      key={tag}
                      variant="chip"
                      checked={form.historyTags.includes(tag)}
                      onChange={() => toggleHistoryTag(tag)}
                    >
                      {tag}
                    </Checkbox>
                  ))}
                  {historyOptions.length === 0 ? (
                    <p className="text-sm text-ink-muted">No matching history tags.</p>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>

          <div className="pt-2 border-t border-line flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Add Patient'}
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
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-10 px-3 rounded-md text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
              disabled={loading}
              onClick={() => savePatient('consent')}
            >
              Add Patient & Consent
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
