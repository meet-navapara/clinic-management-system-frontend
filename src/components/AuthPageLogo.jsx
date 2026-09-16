import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { LOGO_URL, APP_NAME } from '../constants/branding';

export default function AuthPageLogo({ className = '' }) {
  const [logoError, setLogoError] = useState(false);

  return (
    <Link
      to="/"
      className={`inline-flex justify-center transition-opacity hover:opacity-90 ${className}`}
      aria-label={`Go to ${APP_NAME} home`}
    >
      {!logoError ? (
        <img
          src={LOGO_URL}
          alt=""
          className="h-auto w-auto max-h-16 xs:max-h-20 sm:max-h-24 max-w-[min(100%,12rem)] sm:max-w-[min(100%,14rem)] object-contain"
          draggable={false}
          onError={() => setLogoError(true)}
        />
      ) : (
        <Leaf className="w-7 h-7 sm:w-8 sm:h-8 text-[#a8841f]" />
      )}
    </Link>
  );
}
