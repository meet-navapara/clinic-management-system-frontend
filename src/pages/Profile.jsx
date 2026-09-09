import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Save, Stethoscope, Camera } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

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
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
    experience: user?.experience || 0,
    consultationFee: user?.consultationFee || 500,
    bio: user?.bio || '',
    availableDays: user?.availableDays || DAYS.slice(0, 5),
    availableSlots: user?.availableSlots || SLOTS,
  });
  const [loading, setLoading] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setProfilePhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
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

  const getPhotoSrc = () => {
    if (photoPreview) return photoPreview;
    if (user?.profilePhoto) return user.profilePhoto;
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      const useFormData = user.role === 'doctor' || profilePhotoFile;

      if (useFormData) {
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('phone', form.phone);

        if (user.role === 'doctor') {
          formData.append('specialization', form.specialization);
          formData.append('experience', String(Number(form.experience)));
          formData.append('consultationFee', String(Number(form.consultationFee)));
          formData.append('bio', form.bio);
          formData.append('availableDays', JSON.stringify(form.availableDays));
          formData.append('availableSlots', JSON.stringify(form.availableSlots));
        }

        if (profilePhotoFile) {
          const compressedPhoto = await compressProfilePhoto(profilePhotoFile);
          formData.append('profilePhoto', compressedPhoto);
        }

        res = await api.put('/auth/profile', formData, {
          transformRequest: [(data, headers) => {
            delete headers['Content-Type'];
            return data;
          }],
        });

        setProfilePhotoFile(null);
        setPhotoPreview(null);
      } else {
        res = await api.put('/auth/profile', { name: form.name, phone: form.phone });
      }

      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const photoSrc = getPhotoSrc();
  const hasProfilePhoto = Boolean(user?.profilePhoto);
  const photoButtonLabel = hasProfilePhoto ? 'Edit' : 'Upload Photo';

  return (
    <div className="page-container">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage your account information</p>
      </div>

      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2 shrink-0">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={user?.name}
                className="w-16 h-16 rounded-2xl object-cover object-center block ring-2 ring-[#d4af37]/30"
              />
            ) : (
              <UserAvatar
                name={user?.name}
                profilePhoto={user?.profilePhoto}
                role={user?.role}
                size="xl"
                rounded="xl"
              />
            )}
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="text-xs border border-primary-600 rounded-lg px-2 py-[2px] text-primary-600 font-medium hover:text-primary-700 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-3.5 h-3.5" />
                {photoButtonLabel}
              </button>
            </>
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-lg font-semibold leading-tight">{user?.name}</h2>
            <p className="text-sm text-gray-500 capitalize mt-1">{user?.role}</p>
            <p className="text-sm text-gray-400 mt-0.5 break-all sm:break-normal">{user?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <fieldset disabled={loading} className="space-y-5 border-0 p-0 m-0 min-w-0">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <User className="w-4 h-4 inline mr-1" /> Full Name
          </label>
          <input name="name" className="input-field" value={form.name} onChange={handleChange} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Phone className="w-4 h-4 inline mr-1" /> Phone
          </label>
          <input name="phone" className="input-field" value={form.phone} onChange={handleChange} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="w-4 h-4 inline mr-1" /> Email
          </label>
          <input className="input-field bg-gray-50" value={user?.email} disabled />
        </div>

        {user?.role === 'doctor' && (
          <>
            <div className="border-t pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="w-5 h-5 text-primary-600" />
                <span className="font-medium">Doctor Settings</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input name="specialization" className="input-field" value={form.specialization} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                <input name="experience" type="number" className="input-field" value={form.experience} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                <input name="consultationFee" type="number" className="input-field" value={form.consultationFee} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea name="bio" className="input-field" rows={3} value={form.bio} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      form.availableDays.includes(day)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
              <div className="flex flex-wrap gap-2">
                {SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      form.availableSlots.includes(slot)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <button type="submit" className="btn-primary w-full !py-3 inline-flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        </fieldset>
      </form>
    </div>
  );
}
