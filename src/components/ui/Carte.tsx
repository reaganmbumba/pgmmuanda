export function Carte({
  titre,
  action,
  children,
  className = "",
}: {
  titre?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}
    >
      {(titre || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {titre && (
            <h2 className="text-base font-semibold text-marine-900">{titre}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EnTete({
  titre,
  description,
  actions,
}: {
  titre: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-marine-900">
          {titre}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
