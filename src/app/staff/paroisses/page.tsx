import { Trash2 } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Carte, EnTete } from "@/components/ui/Carte";
import { ModulePrevu } from "@/components/ui/ModulePrevu";
import { exigerAcces } from "@/lib/auth/session";
import { estAdmin, peutGererMembres } from "@/lib/auth/roles";
import { lireOrganisation } from "@/lib/membres/depot";
import { menuStaff } from "@/lib/navigation";
import { supabaseActif } from "@/lib/supabase/config";
import { supprimerOrganisation } from "./actions";
import { FormulaireChorale, FormulaireParoisse, Renommer } from "./Formulaires";

export const metadata = { title: "Paroisses et chorales" };

export default async function PageParoisses() {
  if (!supabaseActif) return <ModulePrevu entree={menuStaff.find((e) => e.href === "/staff/paroisses")!} />;
  const moi = await exigerAcces("/staff/paroisses");
  const { paroisses, chorales } = await lireOrganisation();
  const admin = estAdmin(moi?.role);
  const mesParoisses = admin ? paroisses : paroisses.filter((p) => p.id === moi?.paroisseId);

  return (
    <>
      <EnTete titre="Paroisses et chorales" description="Organisation de la PGM Muanda : chaque membre est rattaché à une paroisse et, si besoin, à une chorale." />
      <div className="space-y-5">
        {admin && <Carte titre="Nouvelle paroisse"><FormulaireParoisse /></Carte>}
        {peutGererMembres(moi?.role) && mesParoisses.length > 0 && (
          <Carte titre="Nouvelle chorale"><FormulaireChorale paroisses={mesParoisses} /></Carte>
        )}
        {paroisses.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Aucune paroisse enregistrée.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {paroisses.map((p) => {
              const siennes = chorales.filter((c) => c.paroisseId === p.id);
              const gere = admin || p.id === moi?.paroisseId;
              return (
                <Carte key={p.id} titre={`${p.nom}${p.estDemo ? " (démo)" : ""}`}
                  action={admin ? (
                    <ActionConfirmee action={supprimerOrganisation} champs={{ type: "paroisse", id: p.id }} danger
                      libelle="Supprimer" icone={<Trash2 className="size-3.5" aria-hidden />}
                      question="Supprimer cette paroisse ?" />
                  ) : undefined}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">{p.ville}</p>
                    {admin && <Renommer type="paroisse" id={p.id} nom={p.nom} />}
                  </div>
                  {siennes.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucune chorale.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 text-sm">
                      {siennes.map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                          <span className="text-marine-900">{c.nom}{c.estDemo && <span className="text-or-600"> (démo)</span>}</span>
                          {gere && peutGererMembres(moi?.role) && (<div className="flex items-center gap-2">
                            <Renommer type="chorale" id={c.id} nom={c.nom} />
                            <ActionConfirmee action={supprimerOrganisation} champs={{ type: "chorale", id: c.id }} danger
                              libelle="Retirer" question="Supprimer cette chorale ? Ses membres resteront dans la paroisse." />
                          </div>)}
                        </li>
                      ))}
                    </ul>
                  )}
                </Carte>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
