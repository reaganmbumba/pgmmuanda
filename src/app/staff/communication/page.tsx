import Link from "next/link";
import { Megaphone, MessageCircle } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Badge } from "@/components/ui/Badge";
import { Bouton } from "@/components/ui/Bouton";
import { EnTete } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { estAdmin, peutPublier } from "@/lib/auth/roles";
import { annonces as annoncesDemo } from "@/lib/demo-data";
import { formatDate, formatDateHeure } from "@/lib/format";
import { lireOrganisation } from "@/lib/membres/depot";
import { decrireCiblage, listerAnnonces } from "@/lib/programmes/depot";
import { lienWhatsApp } from "@/lib/programmes/libelles";
import { supabaseActif, URL_SITE } from "@/lib/supabase/config";
import { archiverAnnonce } from "./actions";

export const metadata = { title: "Communication" };

function Onglet({ href, actif, children }: { href: string; actif: boolean; children: string }) {
  return (
    <Link href={href} aria-current={actif ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${actif ? "bg-marine-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
      {children}
    </Link>
  );
}

export default async function PageCommunication({ searchParams }: { searchParams: Promise<{ vue?: string; publiee?: string }> }) {
  const moi = await exigerAcces("/staff/communication");
  if (!supabaseActif || !moi) return <CommunicationDemo />;
  const { vue, publiee } = await searchParams;
  const archives = vue === "archives";
  const [annonces, organisation] = await Promise.all([listerAnnonces({ archivees: archives, limite: 100 }), lireOrganisation()]);
  const gerable = (portee: string | null) =>
    estAdmin(moi.role) || (moi.role === "responsable_paroisse" && !!portee && portee === moi.paroisseId);

  return (
    <>
      <EnTete
        titre="Communication"
        description="Annonces, communiqués et invitations, envoyés aux membres concernés."
        actions={
          <>
            <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
              <Onglet href="/staff/communication" actif={!archives}>Publiées</Onglet>
              <Onglet href="/staff/communication?vue=archives" actif={archives}>Archivées</Onglet>
            </div>
            {peutPublier(moi.role) && (
              <Bouton href="/staff/communication/nouvelle"><Megaphone className="size-4" aria-hidden /> Nouvelle annonce</Bouton>
            )}
          </>
        }
      />
      {publiee && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Annonce publiée : les membres concernés ont été notifiés dans l&apos;application.</p>}
      {annonces.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {archives ? "Aucune annonce archivée." : "Aucune annonce publiée."}
        </p>
      ) : (
        <ul className="space-y-4">
          {annonces.map((a) => {
            const c = decrireCiblage(a.ciblage, organisation);
            const texte = `*${a.type} : ${a.titre}*\n${a.contenu}\n\nPGM Muanda — ${URL_SITE}/choriste/annonces`;
            return (
              <li key={a.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm" data-annonce={a.titre}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2"><Badge>{a.type}</Badge>
                    <span className="text-xs text-slate-400">{formatDateHeure(a.date)}{a.auteur ? ` · ${a.auteur}` : ""}</span>
                  </div>
                  <span className="text-xs text-slate-500">{c.portee} · {c.cibles}</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-marine-900">{a.titre}</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{a.contenu}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <a href={lienWhatsApp(texte)} target="_blank" rel="noopener"
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50">
                    <MessageCircle className="size-3.5" aria-hidden /> Partager sur WhatsApp
                  </a>
                  {gerable(a.ciblage.portee) && (
                    <ActionConfirmee action={archiverAnnonce} champs={{ id: a.id, archivee: archives ? "non" : "oui" }}
                      libelle={archives ? "Restaurer" : "Archiver"}
                      question={archives ? "Republier cette annonce ?" : "Archiver ? Les choristes ne la verront plus."} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** Annonces de démonstration, affichées uniquement en mode maquette (sans Supabase). */
function CommunicationDemo() {
  return (
    <>
      <EnTete titre="Communication" description="Annonces, communiqués et invitations, envoyés aux membres concernés."
        actions={<Bouton><Megaphone className="size-4" aria-hidden /> Nouvelle annonce</Bouton>} />
      <ul className="space-y-4">
        {annoncesDemo.map((a) => (
          <li key={a.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2"><Badge>{a.type}</Badge><span className="text-xs text-slate-400">{formatDate(a.date)} · {a.cible}</span></div>
            <h2 className="mt-2 text-lg font-semibold text-marine-900">{a.titre}</h2>
            <p className="mt-1 text-sm text-slate-600">{a.extrait}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
