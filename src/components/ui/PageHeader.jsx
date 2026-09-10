export default function PageHeader({ title, description, actions, crumb }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {crumb && <p className="section-label mb-1">{crumb}</p>}
        {title && <h1 className="page-title">{title}</h1>}
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
