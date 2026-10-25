const tons = {
  vert: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  ambre: "bg-amber-50 text-amber-800 ring-amber-600/20",
  rouge: "bg-red-50 text-red-700 ring-red-600/20",
  gris: "bg-slate-100 text-slate-600 ring-slate-500/20",
  marine: "bg-marine-100 text-marine-800 ring-marine-700/20",
  or: "bg-or-100 text-or-600 ring-or-500/30",
} as const;

export type Ton = keyof typeof tons;

const parStatut: Record<string, Ton> = {
  Actif: "vert",
  Active: "vert",
  Présent: "vert",
  Confirmé: "vert",
  Réalisé: "marine",
  "En attente": "ambre",
  Prévu: "marine",
  Excusé: "ambre",
  Reporté: "ambre",
  Inactif: "gris",
  Remplacée: "gris",
  Suspendu: "rouge",
  Révoquée: "rouge",
  Absent: "rouge",
  Annulé: "rouge",
  Urgente: "rouge",
  Officielle: "marine",
  Changement: "ambre",
  Invitation: "or",
  Communiqué: "gris",
};

export function Badge({ children, ton }: { children: string; ton?: Ton }) {
  const t = ton ?? parStatut[children] ?? "gris";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tons[t]}`}
    >
      {children}
    </span>
  );
}
