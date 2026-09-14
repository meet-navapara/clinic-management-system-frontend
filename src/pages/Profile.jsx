import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Save, Camera } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import Checkbox from '../components/ui/Checkbox';
import RequiredMark from '../components/ui/RequiredMark';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

const compressProfilePhoto = (file, maxSize = 512) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not process image.'));
            return;
          }
          resolve(new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.88
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid image file.'));
    };
    img.src = url;
  });

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const isDoctor = user?.role === 'doctor';
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
    qualification: user?.qualification || '',
    licenseNumber: user?.licenseNumber || '',
    clinicName: user?.clinicName || '',
    clinicAddress: user?.clinicAddress || '',
    city: user?.city || '',
    bio: user?.bio || '',
    availableDays: user?.availableDays || DAYS.slice(0, 5),
    availableSlots: user?.availableSlots || SLOTS,
    defaultDurationMinutes: user?.practiceSettings?.defaultDurationMinutes || 30,
    reminderHours: (user?.practiceSettings?.reminderHoursBefore || [24, 2]).join(', '),
    sendConfirmationReminder: user?.practiceSettings?.sendConfirmationReminder !== false,
  });
  const [section, setSection] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
      formData.append('phone', form.phone);
      if (isDoctor) {
        formData.append('specialization', form.specialization);
        formData.append('qualification', form.qualification);
        formData.append('licenseNumber', form.licenseNumber);
        formData.append('clinicName', form.clinicName);
        formData.append('clinicAddress', form.clinicAddress);
        formData.append('city', form.city);
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
          })
        );
      }
      if (profilePhotoFile) {
        formData.append('profilePhoto', await compressProfilePhoto(profilePhotoFile));
      }

      const res = await api.put('/auth/profile', formData, {
        transformRequest: [(data, headers) => {
          delete headers['Content-Type'];
          return data;
        }],
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

  return (
    <div className="page-container">
      {isDoctor && (
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            ['personal', 'Personal'],
            ['practice', 'Practice'],
            ['schedule', 'Schedule & reminders'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={`tab-chip ${
                section === key ? 'bg-ink text-white' : 'bg-white text-ink-muted ring-1 ring-line'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <fieldset disabled={loading} className="space-y-4 border-0 p-0 m-0">
          {(section === 'personal' || !isDoctor) && (
            <>
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
                className="btn-secondary !min-h-8 !py-1 !px-2.5 text-xs"
              >
                <Camera className="w-3.5 h-3.5" /> Photo
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">
              <User className="w-4 h-4 inline mr-1" /> Name <RequiredMark />
            </label>
            <input name="name" className="input-field" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label className="label-field">
              <Phone className="w-4 h-4 inline mr-1" /> Phone <RequiredMark />
            </label>
            <input name="phone" className="input-field" value={form.phone} onChange={handleChange} required />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">
              <Mail className="w-4 h-4 inline mr-1" /> Email
            </label>
            <input className="input-field" value={user?.email || ''} disabled />
          </div>
          </div>
            </>
          )}

          {isDoctor && section === 'practice' && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Specialization</label>
                <input name="specialization" className="input-field" value={form.specialization} onChange={handleChange} />
              </div>
              <div>
                <label className="label-field">Qualification</label>
                <input name="qualification" className="input-field" value={form.qualification} onChange={handleChange} />
              </div>
              <div>
                <label className="label-field">License number</label>
                <input name="licenseNumber" className="input-field" value={form.licenseNumber} onChange={handleChange} />
              </div>
              <div>
                <label className="label-field">Clinic / practice name</label>
                <input name="clinicName" className="input-field" value={form.clinicName} onChange={handleChange} />
              </div>
              <div className="sm:col-span-2">
                <label className="label-field">Clinic address</label>
                <input name="clinicAddress" className="input-field" value={form.clinicAddress} onChange={handleChange} />
              </div>
              <div>
                <label className="label-field">City</label>
                <input name="city" className="input-field" value={form.city} onChange={handleChange} />
              </div>
              <div className="sm:col-span-2">
                <label className="label-field">Bio</label>
                <textarea name="bio" className="input-field" rows={3} value={form.bio} onChange={handleChange} />
              </div>
              </div>
            </>
          )}

          {isDoctor && section === 'schedule' && (
            <>
              <div>
                <label className="label-field">Available days</label>
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
                <label className="label-field">Time slots</label>
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
              <div>
                <label className="label-field">Default duration (minutes)</label>
                <input
                  name="defaultDurationMinutes"
                  type="number"
                  min="5"
                  className="input-field"
                  value={form.defaultDurationMinutes}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label-field">
                  Reminder hours before (comma-separated)
                </label>
                <input
                  name="reminderHours"
                  className="input-field"
                  placeholder="24, 2"
                  value={form.reminderHours}
                  onChange={handleChange}
                />
              </div>
              <Checkbox
                checked={form.sendConfirmationReminder}
                onChange={(e) =>
                  setForm({ ...form, sendConfirmationReminder: e.target.checked })
                }
              >
                Send confirmation when appointment is booked
              </Checkbox>
            </>
          )}

          <button type="submit" className="btn-primary inline-flex">
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save'}
          </button>
        </fieldset>
      </form>
    </div>
  );
}
