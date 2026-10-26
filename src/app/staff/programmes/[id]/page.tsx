import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, MapPin, MessageCircle, Pencil, ScanLine, User, Users } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Badge } from "@/components/ui/Badge";
import { Bouton } from "@/components/ui/Bouton";
import { Carte, EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { formatDateHeure, formatHeure, nomComplet } from "@/lib/format";
import { listerMembres, lireOrganisation } from "@/lib/membres/depot";
import { decrireCiblage, lireActivite, presencesActivite, taux } from "@/lib/programmes/depot";
import { peutModifierActivite } from "@/lib/programmes/droits";
import { concerne, jourLocal, lienWhatsApp, STATUTS_PRESENCE } from "@/lib/programmes/libelles";
import { supabaseActif, URL_SITE } from "@/lib/supabase/config";
import { changerStatutActivite } from "../actions";
import { FeuillePresence, type LignePresence } from "./FeuillePresence";

export const metadata = { title: "Activité" };

export default async function PageActivite({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ enregistre?: string }>;
}) {
  const { id } = await params;
  const moi = await exigerAcces("/staff/programmes");
  if (!supabaseActif || !moi) redirect("/staff/programmes");
  const activite = await lireActivite(id);
  if (!activite) notFound();
  const { enregistre } = await searchParams;
  const [organisation, membres, presences] = await Promise.all([lireOrganisation(), listerMembres(), presencesActivite(id)]);

  const modifiable = peutModifierActivite(moi, activite);
  const { portee, cibles } = decrireCiblage(activite.ciblage, organisation);
  const parMembre = new Map(presences.map((p) => [p.membreId, p]));
  const lignes: LignePresence[] = membres
    .filter((m) => concerne(activite.ciblage, m))
    .map((m) => ({
      id: m.id, matricule: m.matricule, nom: nomComplet(m), paroisse: m.paroisse, voix: m.voix,
      statut: parMembre.get(m.id)?.statutCode ?? "", parQr: parMembre.get(m.id)?.methode === "qr",
    }));
  const comptes = (Object.keys(STATUTS_PRESENCE) as (keyof typeof STATUTS_PRESENCE)[])
    .map((s) => ({ s, n: presences.filter((p) => p.statutCode === s).length }));
  const t = taux(presences);
  const annulee = activite.statutCode === "annulee";

  const partage = [
    `*${activite.titre}*`,
    `${formatDateHeure(activite.debut)}${activite.fin ? ` – ${formatHeure(activite.fin)}` : ""}`,
    activite.lieu && `Lieu : ${activite.lieu}`,
    activite.statutCode === "annulee" ? "ATTENTION : activité annulée." : activite.statutCode === "reportee" ? "ATTENTION : activité reportée." : "",
    activite.description,
    `Programme complet : ${URL_SITE}/choriste/programme`,
  ].filter(Boolean).join("\n");

  return (
    <>
      <EnTete
        titre={activite.titre}
        description={`${portee} · ${cibles}`}
        actions={
          <>
            <Bouton variante="secondaire" href={lienWhatsApp(partage)} target="_blank" rel="noopener">
              <MessageCircle className="size-4" aria-hidden /> Partager sur WhatsApp
            </Bouton>
            {!annulee && (
              <Bouton variante="secondaire" href={`/staff/presences?activite=${activite.id}`}>
                <ScanLine className="size-4" aria-hidden /> Pointer par QR
              </Bouton>
            )}
            {modifiable && (
              <Bouton href={`/staff/programmes/${activite.id}/modifier`}>
                <Pencil className="size-4" aria-hidden /> Modifier
              </Bouton>
            )}
          </>
        }
      />
      {enregistre && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Activité enregistrée.</p>}

      <div className="grid gap-6 xl:grid-cols-3">
        <Carte titre="Détails">
          <div className="mb-3"><Badge>{activite.statut}</Badge></div>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2"><CalendarDays className="size-4 shrink-0 text-or-500" aria-hidden />
              {formatDateHeure(activite.debut)}{activite.fin && ` – ${jourLocal(activite.fin) === jourLocal(activite.debut) ? formatHeure(activite.fin) : formatDateHeure(activite.fin)}`}
            </li>
            {activite.lieu && <li className="flex gap-2"><MapPin className="size-4 shrink-0 text-or-500" aria-hidden /> {activite.lieu}</li>}
            {activite.responsable && <li className="flex gap-2"><User className="size-4 shrink-0 text-or-500" aria-hidden /> {activite.responsable}</li>}
            <li className="flex gap-2"><Users className="size-4 shrink-0 text-or-500" aria-hidden /> {cibles}</li>
            {activite.commission && <li className="text-slate-500">Organisée par : {activite.commission}</li>}
          </ul>
          {activite.description && <p className="mt-4 whitespace-pre-line text-sm text-slate-600">{activite.description}</p>}
          {modifiable && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {/* Boutons masqués plutôt que retirés : le message de résultat reste affiché. */}
              <ActionConfirmee action={changerStatutActivite} champs={{ id: activite.id, statut: "confirmee" }}
                masquer={annulee || activite.statutCode === "confirmee"}
                libelle="Marquer confirmée" question="L'activité est-elle confirmée ?" />
              <ActionConfirmee action={changerStatutActivite} champs={{ id: activite.id, statut: "realisee" }}
                masquer={annulee || activite.statutCode === "realisee"}
                libelle="Marquer réalisée" question="L'activité a-t-elle eu lieu ?" />
              <ActionConfirmee action={changerStatutActivite} champs={{ id: activite.id, statut: "reportee" }}
                masquer={annulee || activite.statutCode === "reportee"}
                libelle="Reporter" question="Reporter ? Les membres concernés seront prévenus." />
              <ActionConfirmee action={changerStatutActivite} champs={{ id: activite.id, statut: "annulee" }} danger
                masquer={annulee}
                libelle="Annuler l'activité" question="Annuler ? Les membres concernés seront prévenus." />
            </div>
          )}
          <p className="mt-4 text-xs text-slate-400">
            « Partager sur WhatsApp » ouvre WhatsApp avec un message prêt : vous choisissez le groupe et envoyez vous-même.
          </p>
        </Carte>

        <Carte titre="Présences" className="xl:col-span-2"
          action={<span className="text-sm text-slate-500">{lignes.length} membre{lignes.length > 1 ? "s" : ""} concerné{lignes.length > 1 ? "s" : ""}</span>}>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {comptes.map(({ s, n }) => (
              <div key={s} className="rounded-xl bg-marine-50 p-3" data-compte={s}>
                <p className="text-xs text-slate-500">{STATUTS_PRESENCE[s]}</p>
                <p className="text-xl font-bold text-marine-900">{n}</p>
              </div>
            ))}
            <div className="rounded-xl bg-or-100/60 p-3">
              <p className="text-xs text-slate-500">Taux de présence</p>
              <p className="text-xl font-bold text-marine-900">{t === null ? "—" : `${t} %`}</p>
            </div>
          </div>
          {annulee ? (
            <p className="text-sm text-slate-500">Activité annulée : aucune présence ne peut être saisie.</p>
          ) : lignes.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun membre de votre périmètre n&apos;est concerné par cette activité.</p>
          ) : (
            <FeuillePresence activite={activite.id} lignes={lignes} />
          )}
        </Carte>
      </div>
      <p className="mt-6 text-sm"><Link href="/staff/programmes" className="text-marine-700 hover:underline">← Retour au programme</Link></p>
    </>
  );
}
