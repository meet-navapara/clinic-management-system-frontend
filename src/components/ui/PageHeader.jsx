export default function PageHeader({ title, description, actions, crumb }) {
  return (
    <div className="mb-4 sm:mb-5 flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {crumb && <p className="section-label mb-0.5 sm:mb-1">{crumb}</p>}
        {title && <h1 className="page-title">{title}</h1>}
        {description && <p className="page-subtitle break-words">{description}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full min-w-0 sm:w-auto sm:shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
