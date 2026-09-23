import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LOGO_URL, APP_NAME } from '../constants/branding';

/** Public copies — reliable if the Vite-bundled asset 404s after deploy. */
const PUBLIC_LOGO = '/brand/Z-Health-logo-clear.png';

export default function AuthPageLogo({ className = '' }) {
  const [src, setSrc] = useState(LOGO_URL || PUBLIC_LOGO);

  return (
    <Link
      to="/"
      className={`inline-flex justify-center items-center transition-opacity hover:opacity-90 ${className}`}
      aria-label={`Go to ${APP_NAME} home`}
    >
      {src ? (
        <img
          src={src}
          alt={APP_NAME}
          className="h-auto w-auto max-h-16 xs:max-h-20 sm:max-h-24 max-w-[min(100%,12rem)] sm:max-w-[min(100%,14rem)] object-contain"
          draggable={false}
          onError={() => {
            if (src !== PUBLIC_LOGO) setSrc(PUBLIC_LOGO);
            else setSrc('');
          }}
        />
      ) : (
        <span className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">{APP_NAME}</span>
      )}
    </Link>
  );
}
