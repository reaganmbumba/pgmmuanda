import { PencilLine } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Bouton } from "@/components/ui/Bouton";
import { choristeConnecte as moi } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Mon profil" };

export default function MonProfil() {
  const lignes: [string, string][] = [
    ["Matricule", moi.matricule],
    ["Nom et postnom", `${moi.nom} ${moi.postnom}`],
    ["Prénom", moi.prenom],
    ["Téléphone", moi.telephone],
    ["Adresse e-mail", moi.email],
    ["Paroisse", moi.paroisse],
    ["Chorale", moi.chorale],
    ["Voix", moi.voix],
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
      <Bouton variante="secondaire" className="w-full">
        <PencilLine className="size-4" aria-hidden /> Demander une correction
      </Bouton>
      <p className="text-center text-xs text-slate-400">
        Vos données administratives sont protégées : toute correction est validée par le staff.
      </p>
    </div>
  );
}
