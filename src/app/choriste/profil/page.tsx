import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { utilisateurCourant } from "@/lib/auth/session";
import { choristeConnecte } from "@/lib/demo-data";
import { formatDate, formatDateHeure } from "@/lib/format";
import { lireDemandes, maFiche } from "@/lib/membres/depot";
import { CHAMPS_CORRIGEABLES, STATUTS_DEMANDE, VOIX } from "@/lib/membres/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { FormulaireCorrection } from "./FormulaireCorrection";

export const metadata = { title: "Mon profil" };

type Profil = {
  matricule: string; nom: string; postnom: string; prenom: string; telephone: string; email: string;
  paroisse: string; chorale: string; voix: string; fonction: string; dateAdhesion: string; statut: string;
};

export default async function MonProfil() {
  let moi: Profil | null = choristeConnecte;
  let demandes: Awaited<ReturnType<typeof lireDemandes>> = [];
  if (supabaseActif) {
    const u = await utilisateurCourant();
    moi = u ? await maFiche(u.id) : null;
    if (moi) demandes = await lireDemandes();
  }

  if (!moi) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="font-semibold text-marine-900">Votre fiche n&apos;est pas encore disponible</p>
        <p className="mt-2 text-sm text-slate-500">
          Votre compte n&apos;est pas encore relié à votre fiche de membre. Contactez le secrétariat de la PGM ou le responsable de votre paroisse.
        </p>
      </div>
    );
  }

  const lignes: [string, string][] = [
    ["Matricule", moi.matricule],
    ["Nom et postnom", `${moi.nom} ${moi.postnom}`.trim()],
    ["Prénom", moi.prenom],
    ["Téléphone", moi.telephone || "—"],
    ["Adresse e-mail", moi.email || "—"],
    ["Paroisse", moi.paroisse],
    ["Chorale", moi.chorale || "—"],
    ["Voix", moi.voix || "—"],
    ["Fonction", moi.fonction],
    ["Date d'adhésion", formatDate(moi.dateAdhesion)],
  ];
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center">
        <Avatar membre={moi} taille="xl" />
        <p className="mt-3 text-xl font-bold text-marine-900">{moi.prenom} {moi.nom}</p>
        <div className="mt-1"><Badge>{moi.statut}</Badge></div>
      </div>
      <dl className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
        {lignes.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-right font-medium text-marine-900">{v}</dd>
          </div>
        ))}
      </dl>
      <FormulaireCorrection />
      {demandes.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 font-semibold text-marine-900">Mes demandes</p>
          <ul className="divide-y divide-slate-100 text-sm">
            {demandes.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {CHAMPS_CORRIGEABLES[d.champ as keyof typeof CHAMPS_CORRIGEABLES] ?? d.champ} :{" "}
                  <strong>{d.champ === "voix" ? VOIX[d.valeur as keyof typeof VOIX] ?? d.valeur : d.valeur}</strong>
                  <span className="block text-xs text-slate-400">{formatDateHeure(d.date)}</span>
                </span>
                <Badge ton={d.statut === "acceptee" ? "vert" : d.statut === "refusee" ? "rouge" : "ambre"}>{STATUTS_DEMANDE[d.statut]}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-center text-xs text-slate-400">
        Vos données administratives sont protégées : toute correction est validée par le staff.
      </p>
    </div>
  );
}
