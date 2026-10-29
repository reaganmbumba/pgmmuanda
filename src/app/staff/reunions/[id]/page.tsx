import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Carte, EnTete } from "@/components/ui/Carte";
import { estAdmin } from "@/lib/auth/roles";
import { exigerAcces } from "@/lib/auth/session";
import { conseilA, lireReunion, presencesReunion } from "@/lib/conseil/depot";
import { estAssemblee, libelleFonction, messageConvocation, quorumAtteint } from "@/lib/conseil/libelles";
import { formatDateHeure } from "@/lib/format";
import { jourLocal, lienWhatsApp, STATUTS_PRESENCE, type CodeStatutPresence } from "@/lib/programmes/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { FeuillePresence, FormulaireCompteRendu } from "../Formulaires";

export const metadata = { title: "Réunion" };

export default async function PageReunion({ params }: { params: Promise<{ id: string }> }) {
  const moi = await exigerAcces("/staff/reunions");
  if (!supabaseActif || !moi) notFound();
  const { id } = await params;
  const r = await lireReunion(id);
  if (!r) notFound();
  const admin = estAdmin(moi.role);
  const passee = new Date(r.debut) <= new Date();
  const ag = estAssemblee(r.typeCode);
  // Feuille de présence du Conseil : les membres en fonction le jour de la réunion
  const [conseil, presences] = ag ? [[], new Map<string, string>()] : await Promise.all([conseilA(jourLocal(r.debut)), presencesReunion(r.id)]);
  const presents = conseil.filter((m) => presences.get(m.membreId) === "present").length;

  return (
    <>
      <Link href="/staff/reunions" className="mb-3 inline-block text-sm text-slate-500 hover:underline">← Réunions et AG</Link>
      <EnTete titre={r.titre} description={r.type} actions={<Badge ton={r.statutCode === "tenue" ? "vert" : r.statutCode === "annulee" ? "gris" : "or"}>{r.statut}</Badge>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Carte titre="Convocation">
          <p className="flex items-center gap-2 text-sm text-marine-900"><CalendarClock className="size-4" aria-hidden />{formatDateHeure(r.debut)}</p>
          {r.lieu && <p className="mt-1 flex items-center gap-2 text-sm text-marine-900"><MapPin className="size-4" aria-hidden />{r.lieu}</p>}
          <p className="mt-4 text-sm font-semibold text-marine-900">Ordre du jour</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700" data-ordre-du-jour>{r.ordreDuJour}</p>
          <p className="mt-3 text-xs text-slate-500">
            {ag ? "Seuls ces points peuvent faire l'objet d'une décision (art. 21). Vote à main levée (art. 24)." : "Le Conseil délibère valablement si au moins la moitié de ses membres sont présents (art. 30)."}
            {r.convoquePar && ` Convoquée par ${r.convoquePar}.`}
          </p>
          {r.statutCode === "convoquee" && (
            <a href={lienWhatsApp(messageConvocation(r))} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              <MessageCircle className="size-4" aria-hidden /> Partager la convocation sur WhatsApp
            </a>
          )}
        </Carte>

        <Carte titre="Feuille de présence">
          {ag ? (
            <p className="text-sm text-slate-600">Pour une Assemblée générale, faites signer la feuille de présence sur papier, avec le téléphone de chacun (art. 23),
              et notez le nombre de présents dans le compte rendu.</p>
          ) : conseil.length === 0 ? (
            <p className="text-sm text-slate-500">Personne n&apos;était au Conseil à cette date. Ajoutez d&apos;abord les membres sur la page <Link href="/staff/conseil" className="underline">Conseil</Link>.</p>
          ) : (
            <>
              <p className={`mb-3 rounded-xl p-3 text-sm font-semibold ${quorumAtteint(presents, conseil.length) ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`} data-quorum>
                {presents} présent{presents > 1 ? "s" : ""} sur {conseil.length} · {quorumAtteint(presents, conseil.length) ? "Quorum atteint (art. 30)" : "Quorum pas atteint (il faut au moins la moitié, art. 30)"}
              </p>
              {admin ? (
                <FeuillePresence id={r.id} membres={conseil.map((m) => ({
                  membreId: m.membreId, nom: m.nom, fonction: libelleFonction(m.fonction, m.adjoint), statut: presences.get(m.membreId) ?? null,
                }))} />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {conseil.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <span><span className="font-medium text-marine-900">{m.nom}</span> <span className="text-xs text-slate-500">· {libelleFonction(m.fonction, m.adjoint)}</span></span>
                      <span className="text-slate-600">{presences.has(m.membreId) ? STATUTS_PRESENCE[presences.get(m.membreId) as CodeStatutPresence] : "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Carte>

        <Carte titre="Compte rendu" className="lg:col-span-2">
          {admin ? <FormulaireCompteRendu id={r.id} statut={r.statutCode} compteRendu={r.compteRendu} passee={passee} />
            : r.compteRendu ? <p className="whitespace-pre-line text-sm text-slate-700">{r.compteRendu}</p>
            : <p className="text-sm text-slate-500">Pas encore de compte rendu.</p>}
        </Carte>
      </div>
    </>
  );
}
