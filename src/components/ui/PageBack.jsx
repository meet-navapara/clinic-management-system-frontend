import { useLocation } from 'react-router-dom';
import { shouldShowBackButton } from '../../constants/routes';
import BackButton from './BackButton';

/** Top-left page back control — only on nested/detail pages. */
export default function PageBack({ className = '', to, label = 'Back' }) {
  const { pathname } = useLocation();
  if (!shouldShowBackButton(pathname)) return null;

  return (
    <div className={`mb-3 sm:mb-3.5 ${className}`.trim()}>
      <BackButton to={to} label={label} />
    </div>
  );
}
