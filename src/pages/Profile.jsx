import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Save, Camera, KeyRound } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import Checkbox from '../components/ui/Checkbox';
import RequiredMark from '../components/ui/RequiredMark';
import PageHeader from '../components/ui/PageHeader';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { compressImageFile } from '../utils/image';
import {
  formatIndianMobileInput,
  normalizeIndianMobile,
  meetsPasswordComplexity,
  STRONG_PASSWORD_MESSAGE,
} from '../utils/validation';
import { ROUTES } from '../constants/routes';
import { can, P } from '../constants/permissions';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function roleLabel(user) {
  if (!user) return '—';
  if (user.role === 'super_admin') return 'Super Admin';
  if (user.role === 'doctor') return 'Doctor';
  if (user.customRoleName) return user.customRoleName;
  if (user.staffType) return user.staffType.replace(/_/g, ' ');
  return String(user.role || '—').replace(/_/g, ' ');
}

function listToText(list) {
  return Array.isArray(list) ? list.filter(Boolean).join(', ') : '';
}

function textToList(value) {
  return String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Parse "24, 2, 3d" → hours [24, 2, 72]. Supports Nd / Nday / Ndays. */
function parseReminderHoursInput(value) {
  return String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const dayMatch = part.match(/^(\d+(?:\.\d+)?)\s*d(?:ays?)?$/i);
      if (dayMatch) {
        const days = Number(dayMatch[1]);
        return Number.isFinite(days) && days > 0 ? days * 24 : NaN;
      }
      const hours = Number(part);
      return Number.isFinite(hours) && hours > 0 ? hours : NaN;
    })
    .filter((n) => !Number.isNaN(n) && n > 0);
}

/** Format stored hours for the input: 72 → "3d", 24 → "24", 2 → "2". */
function formatReminderHoursInput(list) {
  if (!Array.isArray(list) || !list.length) return '24, 2';
  return list
    .map((n) => {
      const hours = Number(n);
      if (!Number.isFinite(hours) || hours <= 0) return null;
      if (hours >= 48 && hours % 24 === 0) return `${hours / 24}d`;
      return String(hours);
    })
    .filter(Boolean)
    .join(', ');
}

function Field({ id, label, required, children, className = '', hint }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label-field">
        {label}
        {required ? (
          <>
            {' '}
            <RequiredMark />
          </>
        ) : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-faint mt-1">{hint}</p> : null}
    </div>
  );
}

function buildFormFromUser(user) {
  const settings = user?.practiceSettings || {};
  return {
    name: user?.name || '',
    phone: normalizeIndianMobile(user?.phone) || formatIndianMobileInput(user?.phone || ''),
    specialization: user?.specialization || '',
    qualification: user?.qualification || '',
    licenseNumber: user?.licenseNumber || '',
    experience: user?.experience ?? '',
    consultationFee: user?.consultationFee ?? '',
    consultationTypes: listToText(user?.consultationTypes),
    clinicName: user?.clinicName || '',
    clinicAddress: user?.clinicAddress || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || '',
    postalCode: user?.postalCode || '',
    bio: user?.bio || '',
    availableDays: user?.availableDays?.length ? user.availableDays : DAYS.slice(0, 5),
    defaultDurationMinutes: settings.defaultDurationMinutes || 30,
    reminderHours: formatReminderHoursInput(settings.reminderHoursBefore || [24, 2]),
    appointmentTypes: listToText(settings.appointmentTypes || ['Consultation', 'Follow-up', 'Procedure']),
    sendConfirmationReminder: settings.sendConfirmationReminder !== false,
    dayStart: settings.dayStart || '09:00',
    dayEnd: settings.dayEnd || '18:00',
    breakStart: settings.breakStart || '13:00',
    breakEnd: settings.breakEnd || '14:00',
  };
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);
  const isDoctor = user?.role === 'doctor';
  const tabs = useMemo(() => {
    const list = [{ id: 'personal', label: 'Personal' }];
    if (isDoctor) {
      list.push({ id: 'practice', label: 'Practice' });
      list.push({ id: 'schedule', label: 'Schedule' });
    }
    list.push({ id: 'password', label: 'Password' });
    return list;
  }, [isDoctor]);

  const [tab, setTab] = useState('personal');
  const [form, setForm] = useState(() => buildFormFromUser(user));
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [clearPhoto, setClearPhoto] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    setForm(buildFormFromUser(user));
  }, [user?._id, user?.updatedAt]);

  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab('personal');
  }, [tabs, tab]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'phone' ? formatIndianMobileInput(value) : value,
    }));
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const onPhotoSelected = (file) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file ? URL.createObjectURL(file) : null;
    setProfilePhotoFile(file);
    setPhotoPreview(previewUrlRef.current);
    setClearPhoto(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDoctor && form.availableDays.length < 1) {
      toast.error('Select at least one available day.');
      setTab('schedule');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      const phone = normalizeIndianMobile(form.phone);
      if (!phone) {
        toast.error('Mobile number must be exactly 10 digits.');
        setTab('personal');
        setLoading(false);
        return;
      }
      formData.append('phone', phone);
      if (isDoctor) {
        formData.append('specialization', form.specialization);
        formData.append('qualification', form.qualification);
        formData.append('licenseNumber', form.licenseNumber);
        formData.append('experience', String(form.experience === '' ? 0 : Number(form.experience)));
        formData.append(
          'consultationFee',
          String(form.consultationFee === '' ? 0 : Number(form.consultationFee))
        );
        formData.append('consultationTypes', JSON.stringify(textToList(form.consultationTypes)));
        formData.append('clinicName', form.clinicName);
        formData.append('clinicAddress', form.clinicAddress);
        formData.append('city', form.city);
        formData.append('state', form.state);
        formData.append('country', form.country);
        formData.append('postalCode', form.postalCode);
        formData.append('bio', form.bio);
        formData.append('availableDays', JSON.stringify(form.availableDays));
        formData.append(
          'practiceSettings',
          JSON.stringify({
            defaultDurationMinutes: Number(form.defaultDurationMinutes) || 30,
            reminderHoursBefore: parseReminderHoursInput(form.reminderHours),
            sendConfirmationReminder: form.sendConfirmationReminder,
            appointmentTypes: textToList(form.appointmentTypes),
            dayStart: form.dayStart || '09:00',
            dayEnd: form.dayEnd || '18:00',
            breakStart: form.breakStart || '13:00',
            breakEnd: form.breakEnd || '14:00',
          })
        );
      }
      if (profilePhotoFile) {
        formData.append(
          'profilePhoto',
          await compressImageFile(profilePhotoFile, { filename: 'profile.jpg', quality: 0.88 })
        );
      }
      if (clearPhoto) formData.append('clearPhoto', '1');

      const res = await api.put('/auth/profile', formData, {
        transformRequest: [
          (data, headers) => {
            delete headers['Content-Type'];
            return data;
          },
        ],
      });

      updateUser(res.data.user);
      setProfilePhotoFile(null);
      setPhotoPreview(null);
      setClearPhoto(false);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      toast.success('Profile saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (!pwd.currentPassword || !pwd.newPassword) {
      toast.error('Enter current and new password.');
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    if (pwd.newPassword.length < 8 || !meetsPasswordComplexity(pwd.newPassword)) {
      toast.error(STRONG_PASSWORD_MESSAGE);
      return;
    }
    setPwdLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const photoSrc = clearPhoto ? null : photoPreview || user?.profilePhoto || null;
  const createdAt = user?.createdAt && isValid(new Date(user.createdAt)) ? new Date(user.createdAt) : null;
  const joiningDate =
    user?.joiningDate && isValid(new Date(user.joiningDate)) ? new Date(user.joiningDate) : null;
  const showProfileSave = tab !== 'password';

  return (
    <div className="page-container relative">
      <LoadingOverlay show={loading || pwdLoading} message={pwdLoading ? 'Updating password…' : 'Saving…'} />
      <PageHeader
        title="Profile"
        description="Your account details. Letterhead and invoice branding are under Print Settings."
        actions={
          <div className="flex flex-wrap gap-2">
            {can(user, P.PRINT_SETTINGS) ? (
              <Link to={ROUTES.printSettings} className="btn-secondary">
                Print settings
              </Link>
            ) : null}
            {showProfileSave ? (
              <button type="submit" form="profile-form" className="btn-primary" disabled={loading}>
                <Save className="w-4 h-4" />
                {loading ? 'Saving…' : 'Save'}
              </button>
            ) : null}
          </div>
        }
      />

      <div
        className="flex flex-wrap gap-2 mb-4"
        role="tablist"
        aria-label="Profile sections"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab-chip ${
              tab === t.id ? 'bg-ink text-white' : 'bg-white text-ink-muted ring-1 ring-line'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div>
          {tab !== 'password' ? (
            <form id="profile-form" onSubmit={handleSubmit}>
              <fieldset disabled={loading} className="space-y-4 border-0 p-0 m-0">
                {tab === 'personal' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {photoSrc ? (
                        <img
                          src={photoSrc}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover ring-2 ring-[#d4af37]/30"
                        />
                      ) : (
                        <UserAvatar name={user?.name} role={user?.role} size="lg" rounded="xl" />
                      )}
                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            e.target.value = '';
                            if (file && file.size > 2 * 1024 * 1024) {
                              toast.error('Photo must be under 2MB (it will be compressed on save).');
                              return;
                            }
                            onPhotoSelected(file);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-secondary btn-sm"
                        >
                          <Camera className="w-3.5 h-3.5" /> Photo
                        </button>
                        {(photoSrc || user?.profilePhoto) && (
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            onClick={() => {
                              onPhotoSelected(null);
                              setClearPhoto(true);
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field
                        id="profile-name"
                        label={
                          <>
                            <User className="w-4 h-4 inline mr-1" /> Name
                          </>
                        }
                        required
                      >
                        <input
                          id="profile-name"
                          name="name"
                          className="input-field"
                          value={form.name}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                      <Field
                        id="profile-phone"
                        label={
                          <>
                            <Phone className="w-4 h-4 inline mr-1" /> Phone
                          </>
                        }
                        required
                      >
                        <input
                          id="profile-phone"
                          name="phone"
                          className="input-field"
                          value={form.phone}
                          onChange={handleChange}
                          required
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="9876543210"
                        />
                      </Field>
                      <Field
                        id="profile-email"
                        label={
                          <>
                            <Mail className="w-4 h-4 inline mr-1" /> Email
                          </>
                        }
                      >
                        <input id="profile-email" className="input-field" value={user?.email || ''} disabled />
                      </Field>
                      <Field id="profile-role" label="Role">
                        <input
                          id="profile-role"
                          className="input-field capitalize"
                          value={roleLabel(user)}
                          disabled
                        />
                      </Field>
                      {isDoctor && (
                        <Field id="profile-approval" label="Account status">
                          <input
                            id="profile-approval"
                            className="input-field capitalize"
                            value={user?.approvalStatus || 'approved'}
                            disabled
                          />
                        </Field>
                      )}
                      {joiningDate && (
                        <Field id="profile-joining" label="Joining date">
                          <input
                            id="profile-joining"
                            className="input-field"
                            value={format(joiningDate, 'dd MMM yyyy')}
                            disabled
                          />
                        </Field>
                      )}
                      {createdAt && (
                        <Field id="profile-created" label="Member since">
                          <input
                            id="profile-created"
                            className="input-field"
                            value={format(createdAt, 'dd MMM yyyy')}
                            disabled
                          />
                        </Field>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'practice' && isDoctor && (
                  <div className="space-y-4">
                    <p className="text-xs text-ink-faint">
                      Directory and scheduling details. Invoice letterhead is in Print Settings.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field id="profile-specialization" label="Specialization">
                        <input
                          id="profile-specialization"
                          name="specialization"
                          className="input-field"
                          value={form.specialization}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-qualification" label="Qualification">
                        <input
                          id="profile-qualification"
                          name="qualification"
                          className="input-field"
                          value={form.qualification}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-licenseNumber" label="License number">
                        <input
                          id="profile-licenseNumber"
                          name="licenseNumber"
                          className="input-field"
                          value={form.licenseNumber}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-experience" label="Years of experience">
                        <input
                          id="profile-experience"
                          name="experience"
                          type="number"
                          min="0"
                          className="input-field"
                          value={form.experience}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-consultationFee" label="Consultation fee (₹)">
                        <input
                          id="profile-consultationFee"
                          name="consultationFee"
                          type="number"
                          min="0"
                          className="input-field"
                          value={form.consultationFee}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-consultationTypes" label="Consultation types">
                        <input
                          id="profile-consultationTypes"
                          name="consultationTypes"
                          className="input-field"
                          placeholder="OPD, Follow-up"
                          value={form.consultationTypes}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-clinicName" label="Clinic / practice name">
                        <input
                          id="profile-clinicName"
                          name="clinicName"
                          className="input-field"
                          value={form.clinicName}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-city" label="City">
                        <input
                          id="profile-city"
                          name="city"
                          className="input-field"
                          value={form.city}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-clinicAddress" label="Clinic address" className="sm:col-span-2">
                        <input
                          id="profile-clinicAddress"
                          name="clinicAddress"
                          className="input-field"
                          value={form.clinicAddress}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-state" label="State">
                        <input
                          id="profile-state"
                          name="state"
                          className="input-field"
                          value={form.state}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-country" label="Country">
                        <input
                          id="profile-country"
                          name="country"
                          className="input-field"
                          value={form.country}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-postalCode" label="Postal code">
                        <input
                          id="profile-postalCode"
                          name="postalCode"
                          className="input-field"
                          value={form.postalCode}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-bio" label="Bio" className="sm:col-span-2">
                        <textarea
                          id="profile-bio"
                          name="bio"
                          className="input-field"
                          rows={3}
                          value={form.bio}
                          onChange={handleChange}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {tab === 'schedule' && isDoctor && (
                  <div className="space-y-4">
                    <p className="text-xs text-ink-faint">
                      Booking uses these hours with your default visit duration and lunch break.
                    </p>
                    <div>
                      <p className="label-field">
                        Available days <RequiredMark />
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {DAYS.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`min-h-9 px-3 rounded-lg text-sm font-medium border ${
                              form.availableDays.includes(day)
                                ? 'bg-ink text-white border-ink'
                                : 'bg-white text-ink-muted border-line'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Field id="profile-dayStart" label="Day start" required>
                        <input
                          id="profile-dayStart"
                          name="dayStart"
                          type="time"
                          className="input-field"
                          value={form.dayStart}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                      <Field id="profile-dayEnd" label="Day end" required>
                        <input
                          id="profile-dayEnd"
                          name="dayEnd"
                          type="time"
                          className="input-field"
                          value={form.dayEnd}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                      <Field id="profile-breakStart" label="Break start">
                        <input
                          id="profile-breakStart"
                          name="breakStart"
                          type="time"
                          className="input-field"
                          value={form.breakStart}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-breakEnd" label="Break end">
                        <input
                          id="profile-breakEnd"
                          name="breakEnd"
                          type="time"
                          className="input-field"
                          value={form.breakEnd}
                          onChange={handleChange}
                        />
                      </Field>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field id="profile-duration" label="Default duration (minutes)">
                        <input
                          id="profile-duration"
                          name="defaultDurationMinutes"
                          type="number"
                          min="5"
                          className="input-field"
                          value={form.defaultDurationMinutes}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field id="profile-appointmentTypes" label="Appointment types">
                        <input
                          id="profile-appointmentTypes"
                          name="appointmentTypes"
                          className="input-field"
                          placeholder="Consultation, Follow-up, Procedure"
                          value={form.appointmentTypes}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field
                        id="profile-reminders"
                        label="Reminders before visit (hours or days)"
                        className="sm:col-span-2"
                        hint="Use hours (24, 2) or days with d (3d = 3 days). Example: 24, 2, 3d"
                      >
                        <input
                          id="profile-reminders"
                          name="reminderHours"
                          className="input-field"
                          placeholder="24, 2, 3d"
                          value={form.reminderHours}
                          onChange={handleChange}
                        />
                      </Field>
                    </div>
                    <Checkbox
                      checked={form.sendConfirmationReminder}
                      onChange={(e) => setForm({ ...form, sendConfirmationReminder: e.target.checked })}
                    >
                      Send confirmation when appointment is booked
                    </Checkbox>
                  </div>
                )}
              </fieldset>
            </form>
          ) : (
            <form onSubmit={handlePassword} className="space-y-4">
              <p className="text-xs text-ink-faint inline-flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5" />
                {STRONG_PASSWORD_MESSAGE}
              </p>
              <div className="grid sm:grid-cols-1 gap-4 max-w-md">
                <Field id="pwd-current" label="Current password" required>
                  <input
                    id="pwd-current"
                    type="password"
                    className="input-field"
                    autoComplete="current-password"
                    value={pwd.currentPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                    required
                  />
                </Field>
                <Field id="pwd-new" label="New password" required>
                  <input
                    id="pwd-new"
                    type="password"
                    className="input-field"
                    autoComplete="new-password"
                    value={pwd.newPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                    minLength={8}
                  />
                </Field>
                <Field id="pwd-confirm" label="Confirm new password" required>
                  <input
                    id="pwd-confirm"
                    type="password"
                    className="input-field"
                    autoComplete="new-password"
                    value={pwd.confirmPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                    minLength={8}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
                <button type="submit" className="btn-primary" disabled={pwdLoading}>
                  {pwdLoading ? 'Updating…' : 'Update password'}
                </button>
                <Link to={ROUTES.forgotPassword} className="btn-ghost btn-sm self-center">
                  Forgot password?
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
