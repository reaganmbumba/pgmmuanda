import { Badge } from "@/components/ui/Badge";
import { Carte, EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { dernieresVerifications } from "@/lib/cartes/depot";
import { formatDateHeure } from "@/lib/format";
import { supabaseActif } from "@/lib/supabase/config";
import { Scanner } from "./Scanner";

export const metadata = { title: "Scanner une carte" };

const LIBELLES = { valide: "Valide", revoquee: "Révoquée", inconnue: "Inconnue" } as Record<string, string>;

export default async function PageScanner() {
  if (supabaseActif) await exigerAcces("/staff/scanner");
  const historique = supabaseActif ? await dernieresVerifications() : [];
  return (
    <>
      <EnTete
        titre="Scanner une carte"
        description="Vérifiez la validité d'une carte de choriste avec la caméra ou par matricule."
      />
      <Scanner maquette={!supabaseActif} />
      {supabaseActif && (
        <Carte titre="Derniers contrôles" className="mt-6">
          {historique.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun contrôle enregistré.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {historique.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    <span className="font-mono text-marine-800">{v.matricule ?? `${v.reference.slice(0, 6)}…`}</span>
                    <span className="block text-xs text-slate-400">{formatDateHeure(v.date)}</span>
                  </span>
                  <Badge ton={v.resultat === "valide" ? "vert" : v.resultat === "revoquee" ? "rouge" : "gris"}>{LIBELLES[v.resultat] ?? v.resultat}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      )}
    </>
  );
}
