import { useRef, useState } from 'react';
import { format, isValid } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Save, Camera } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import Checkbox from '../components/ui/Checkbox';
import RequiredMark from '../components/ui/RequiredMark';
import { compressImageFile } from '../utils/image';
import { formatIndianMobileInput, normalizeIndianMobile } from '../utils/validation';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

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

function Field({ id, label, required, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label-field">
        {label}
        {required ? <> <RequiredMark /></> : null}
      </label>
      {children}
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const isDoctor = user?.role === 'doctor';
  const [form, setForm] = useState({
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
    availableSlots: user?.availableSlots?.length ? user.availableSlots : SLOTS,
    defaultDurationMinutes: user?.practiceSettings?.defaultDurationMinutes || 30,
    reminderHours: (user?.practiceSettings?.reminderHoursBefore || [24, 2]).join(', '),
    appointmentTypes: listToText(
      user?.practiceSettings?.appointmentTypes || ['Consultation', 'Follow-up', 'Procedure']
    ),
    sendConfirmationReminder: user?.practiceSettings?.sendConfirmationReminder !== false,
  });
  const [loading, setLoading] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === 'phone' ? formatIndianMobileInput(value) : value,
    });
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const toggleSlot = (slot) => {
    setForm((prev) => ({
      ...prev,
      availableSlots: prev.availableSlots.includes(slot)
        ? prev.availableSlots.filter((s) => s !== slot)
        : [...prev.availableSlots, slot],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      const phone = normalizeIndianMobile(form.phone);
      if (!phone) {
        toast.error('Mobile number must be exactly 10 digits.');
        setLoading(false);
        return;
      }
      formData.append('phone', phone);
      if (isDoctor) {
        formData.append('specialization', form.specialization);
        formData.append('qualification', form.qualification);
        formData.append('licenseNumber', form.licenseNumber);
        formData.append('experience', String(form.experience === '' ? 0 : Number(form.experience)));
        formData.append('consultationFee', String(form.consultationFee === '' ? 0 : Number(form.consultationFee)));
        formData.append('consultationTypes', JSON.stringify(textToList(form.consultationTypes)));
        formData.append('clinicName', form.clinicName);
        formData.append('clinicAddress', form.clinicAddress);
        formData.append('city', form.city);
        formData.append('state', form.state);
        formData.append('country', form.country);
        formData.append('postalCode', form.postalCode);
        formData.append('bio', form.bio);
        formData.append('availableDays', JSON.stringify(form.availableDays));
        formData.append('availableSlots', JSON.stringify(form.availableSlots));
        formData.append(
          'practiceSettings',
          JSON.stringify({
            defaultDurationMinutes: Number(form.defaultDurationMinutes) || 30,
            reminderHoursBefore: String(form.reminderHours)
              .split(',')
              .map((n) => Number(n.trim()))
              .filter((n) => !Number.isNaN(n) && n > 0),
            sendConfirmationReminder: form.sendConfirmationReminder,
            appointmentTypes: textToList(form.appointmentTypes),
          })
        );
      }
      if (profilePhotoFile) {
        formData.append(
          'profilePhoto',
          await compressImageFile(profilePhotoFile, { filename: 'profile.jpg', quality: 0.88 })
        );
      }

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
      toast.success('Profile saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const photoSrc = photoPreview || user?.profilePhoto || null;
  const createdAt = user?.createdAt && isValid(new Date(user.createdAt)) ? new Date(user.createdAt) : null;
  const joiningDate = user?.joiningDate && isValid(new Date(user.joiningDate)) ? new Date(user.joiningDate) : null;

  return (
    <div className="page-container">
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={loading} className="space-y-4 border-0 p-0 m-0">
          <section className="card space-y-4">
            <p className="section-label">Personal</p>
            <div className="flex items-center gap-4">
              {photoSrc ? (
                <img src={photoSrc} alt="" className="w-14 h-14 rounded-xl object-cover ring-2 ring-[#d4af37]/30" />
              ) : (
                <UserAvatar name={user?.name} role={user?.role} size="lg" rounded="xl" />
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setProfilePhotoFile(file);
                    setPhotoPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary btn-sm"
                >
                  <Camera className="w-3.5 h-3.5" /> Photo
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="profile-name" label={<><User className="w-4 h-4 inline mr-1" /> Name</>} required>
                <input
                  id="profile-name"
                  name="name"
                  className="input-field"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </Field>
              <Field id="profile-phone" label={<><Phone className="w-4 h-4 inline mr-1" /> Phone</>} required>
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
              <Field id="profile-email" label={<><Mail className="w-4 h-4 inline mr-1" /> Email</>}>
                <input id="profile-email" className="input-field" value={user?.email || ''} disabled />
              </Field>
              <Field id="profile-role" label="Role">
                <input id="profile-role" className="input-field capitalize" value={roleLabel(user)} disabled />
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
                  <input id="profile-joining" className="input-field" value={format(joiningDate, 'dd MMM yyyy')} disabled />
                </Field>
              )}
              {createdAt && (
                <Field id="profile-created" label="Member since">
                  <input id="profile-created" className="input-field" value={format(createdAt, 'dd MMM yyyy')} disabled />
                </Field>
              )}
            </div>
          </section>

          {isDoctor && (
            <section className="card space-y-4">
              <p className="section-label">Practice</p>
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
                  <input id="profile-city" name="city" className="input-field" value={form.city} onChange={handleChange} />
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
                  <input id="profile-state" name="state" className="input-field" value={form.state} onChange={handleChange} />
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
            </section>
          )}

          {isDoctor && (
            <section className="card space-y-4">
              <p className="section-label">Schedule & reminders</p>
              <div>
                <p className="label-field">Available days</p>
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
              <div>
                <p className="label-field">Time slots</p>
                <div className="flex flex-wrap gap-2">
                  {SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`min-h-9 px-3 rounded-lg text-sm font-medium border ${
                        form.availableSlots.includes(slot)
                          ? 'bg-ink text-white border-ink'
                          : 'bg-white text-ink-muted border-line'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
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
                <Field id="profile-reminders" label="Reminder hours before (comma-separated)" className="sm:col-span-2">
                  <input
                    id="profile-reminders"
                    name="reminderHours"
                    className="input-field"
                    placeholder="24, 2"
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
            </section>
          )}

          <button type="submit" className="btn-primary w-full sm:w-auto justify-center inline-flex">
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save'}
          </button>
        </fieldset>
      </form>
    </div>
  );
}
