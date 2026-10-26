import { Badge } from "@/components/ui/Badge";
import { FicheNonReliee } from "@/components/ui/FicheNonReliee";
import { utilisateurCourant } from "@/lib/auth/session";
import { mesPresences as presencesDemo } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";
import { maFiche } from "@/lib/membres/depot";
import { presencesMembre, taux } from "@/lib/programmes/depot";
import { dansJours } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Mes présences" };

export default async function MesPresences() {
  let lignes: { cle: string; activite: string; date: string; statut: string; statutCode: "present" | "absent" | "excuse" }[];
  if (supabaseActif) {
    const u = await utilisateurCourant();
    const fiche = u ? await maFiche(u.id) : null;
    if (!fiche) return <FicheNonReliee />;
    lignes = (await presencesMembre(fiche.id)).map((p) => ({ cle: p.activiteId, ...p }));
  } else {
    const codes = { Présent: "present", Absent: "absent", Excusé: "excuse" } as const;
    lignes = presencesDemo.map((p) => ({ cle: p.date + p.activite, activite: p.activite, date: p.date, statut: p.statut, statutCode: codes[p.statut] }));
  }
  const limite = dansJours(-30);
  const recentes = supabaseActif ? lignes.filter((l) => l.date >= limite) : lignes;
  const t = taux(recentes);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-marine-900">Mes présences</h1>
      <div className="rounded-2xl bg-marine-900 p-5 text-white">
        <p className="text-sm text-marine-100/80">Taux de présence sur 30 jours</p>
        <p className="mt-1 text-4xl font-bold text-or-400" data-taux>{t === null ? "—" : `${t} %`}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="or-degrade h-full rounded-full" style={{ width: `${t ?? 0}%` }} />
        </div>
        <p className="mt-2 text-xs text-marine-100/70">{recentes.length} activité{recentes.length > 1 ? "s" : ""} avec une présence saisie</p>
      </div>
      {lignes.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">Aucune présence enregistrée pour le moment.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
          {lignes.map((p) => (
            <li key={p.cle} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-marine-900">{p.activite}</p>
                <p className="text-xs text-slate-400">{formatDate(p.date)}</p>
              </div>
              <Badge>{p.statut}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
