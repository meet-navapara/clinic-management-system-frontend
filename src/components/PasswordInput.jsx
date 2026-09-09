import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({
  icon: Icon = Lock,
  iconClassName = 'w-4 h-4 sm:w-5 sm:h-5',
  inputClassName = 'input-field pl-9 sm:pl-10 pr-10 sm:pr-11 !py-2 sm:!py-2.5',
  ...inputProps
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Icon
        className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${iconClassName}`}
      />
      <input
        {...inputProps}
        type={showPassword ? 'text' : 'password'}
        className={inputClassName}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={inputProps.disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-400"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </button>
    </div>
  );
}
