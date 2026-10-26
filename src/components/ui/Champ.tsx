/** Libellé et champ de formulaire, empilés. */
export function Champ({ libelle, aide, children, className = "" }: {
  libelle: string; aide?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-marine-900 ${className}`}>
      {libelle}
      {children}
      {aide && <span className="mt-1 block text-xs font-normal text-slate-500">{aide}</span>}
    </label>
  );
}

/** Barre d'avancement de 0 à 100 %. */
export function Progression({ valeur, libelle }: { valeur: number; libelle?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(valeur)));
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{libelle ?? "Avancement"}</span><span className="font-semibold text-marine-900">{v} %</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${v >= 100 ? "bg-emerald-500" : "bg-or-500"}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

/** Message affiché quand une liste est vide. */
export function Vide({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{children}</p>;
}
