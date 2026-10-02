import { useLocation } from 'react-router-dom';
import { shouldShowBackButton } from '../../constants/routes';
import BackButton from './BackButton';

export default function PageHeader({
  title,
  description,
  actions,
  toolbar,
  filters,
  crumb,
  showBack,
  backTo,
  backLabel = 'Back',
}) {
  const { pathname } = useLocation();
  const displayBack = showBack ?? shouldShowBackButton(pathname);
  const hasPrimaryRow = Boolean(toolbar || actions);
  const hasFilters = Boolean(filters);
  const hasControls = hasPrimaryRow || hasFilters;

  return (
    <div className="mb-4 sm:mb-5">
      {displayBack && (
        <div className="mb-2.5 sm:mb-3">
          <BackButton to={backTo} label={backLabel} />
        </div>
      )}
      <div
        className={`flex flex-col gap-3 ${
          hasControls ? 'md:flex-row md:items-start md:justify-between md:gap-4' : ''
        }`}
      >
        <div className="min-w-0 shrink-0">
          {crumb && <p className="section-label mb-0.5 sm:mb-1">{crumb}</p>}
          {title && <h1 className="page-title">{title}</h1>}
          {description && <p className="page-subtitle break-words">{description}</p>}
        </div>
        {hasControls && (
          <div className="flex flex-col gap-2 w-full md:w-auto md:items-end min-w-0">
            {hasPrimaryRow && (
              <div className="flex flex-row flex-wrap items-center gap-2 w-full md:w-auto md:justify-end min-w-0">
                {toolbar}
                {actions}
              </div>
            )}
            {hasFilters && (
              <div className="flex flex-row flex-wrap items-center gap-2 w-full md:w-auto md:justify-end min-w-0">
                {filters}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
