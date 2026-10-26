import { Download, Printer, RefreshCcw, ShieldX } from "lucide-react";
import { CarteMembre } from "@/components/carte/CarteMembre";
import { Bouton } from "@/components/ui/Bouton";
import { EnTete } from "@/components/ui/Carte";
import { membres } from "@/lib/demo-data";
import { exigerAcces } from "@/lib/auth/session";
import { peutGererMembres } from "@/lib/auth/roles";
import { etatDesCartes } from "@/lib/cartes/depot";
import { adresseLocale } from "@/lib/cartes/lien";
import { supabaseActif, URL_SITE } from "@/lib/supabase/config";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { GestionCarte } from "@/components/carte/GestionCarte";
import Link from "next/link";
import { emettreCartesManquantes } from "./actions";

function CartesDemo() {
  return (
    <>
      <EnTete
        titre="Cartes et QR codes"
        description="Chaque QR code renvoie vers une page de vérification, sans aucune donnée privée."
        actions={
          <>
            <Bouton variante="secondaire">
              <Printer className="size-4" aria-hidden /> Imprimer la sélection
            </Bouton>
            <Bouton variante="or">Générer les cartes manquantes</Bouton>
          </>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {membres.slice(0, 6).map((m) => (
          <div key={m.matricule} className="space-y-3">
            <CarteMembre membre={m} />
            <div className="flex flex-wrap gap-2">
              <Bouton variante="secondaire" className="px-3 py-1.5 text-xs">
                <Download className="size-3.5" aria-hidden /> PDF
              </Bouton>
              <Bouton variante="secondaire" className="px-3 py-1.5 text-xs">
                <RefreshCcw className="size-3.5" aria-hidden /> Rééditer
              </Bouton>
              <Bouton variante="secondaire" className="px-3 py-1.5 text-xs text-red-700">
                <ShieldX className="size-3.5" aria-hidden /> Révoquer
              </Bouton>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export const metadata = { title: "Cartes et QR codes" };

export default async function PageCartes({ searchParams }: { searchParams: Promise<{ paroisse?: string }> }) {
  if (!supabaseActif) return <CartesDemo />;
  const moi = await exigerAcces("/staff/cartes");
  const gestion = peutGererMembres(moi?.role);
  const tous = await etatDesCartes();
  const { paroisse } = await searchParams;
  const paroisses = [...new Map(tous.map((m) => [m.paroisseId, m.paroisse])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const lignes = paroisse ? tous.filter((m) => m.paroisseId === paroisse) : tous;
  const actives = lignes.filter((m) => m.carte).length;
  const manquantes = lignes.filter((m) => !m.carte && m.statutMembre === "actif").length;

  return (
    <>
      <EnTete
        titre="Cartes et QR codes"
        description="Chaque QR code renvoie vers une page de vérification, sans aucune donnée privée."
        actions={gestion ? (
          <div className="flex flex-wrap items-start gap-2">
            {actives > 0 && (
              <a href={`/staff/cartes/impression${paroisse ? `?paroisse=${paroisse}` : ""}`} target="_blank" rel="noopener"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-marine-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                <Printer className="size-4" aria-hidden /> Imprimer les cartes (A4)
              </a>
            )}
            <ActionConfirmee action={emettreCartesManquantes} champs={{}} libelle={`Émettre les cartes manquantes (${manquantes})`}
              question={`Émettre ${manquantes} carte(s) pour les membres actifs qui n'en ont pas ?`} masquer={manquantes === 0} />
          </div>
        ) : undefined}
      />
      {adresseLocale && (
        <p role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Les QR codes pointent vers <strong>{URL_SITE}</strong>, une adresse locale qui ne fonctionnera pas sur les téléphones des contrôleurs.
          N&apos;imprimez pas de cartes définitives avant la mise en ligne (Étape 8) ou réglez NEXT_PUBLIC_SITE_URL sur l&apos;adresse publique.
        </p>
      )}
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/staff/cartes" className={`rounded-full px-3 py-1 ring-1 ring-inset ${!paroisse ? "bg-marine-900 text-white ring-marine-900" : "ring-slate-300 text-marine-800"}`}>Toutes</Link>
        {paroisses.map(([id, nom]) => (
          <Link key={id} href={`/staff/cartes?paroisse=${id}`} className={`rounded-full px-3 py-1 ring-1 ring-inset ${paroisse === id ? "bg-marine-900 text-white ring-marine-900" : "ring-slate-300 text-marine-800"}`}>{nom}</Link>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {lignes.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Aucun membre.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {lignes.map((m) => (
              <li key={m.membreId} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <Link href={`/staff/membres/${m.membreId}`} className="font-medium text-marine-900 hover:underline">
                    {m.prenom} {m.nom} {m.postnom}
                  </Link>
                  <p className="text-xs text-slate-500"><span className="font-mono font-semibold text-marine-700">{m.matricule}</span> · {m.paroisse}</p>
                </div>
                <div className="w-44 text-xs text-slate-500">
                  {m.carte ? <>Émise le {formatDate(m.carte.dateEmission)}</> : m.statutMembre === "actif" ? "Pas de carte" : "Membre non actif"}
                </div>
                <div className="w-24"><Badge>{m.carte ? "Active" : "Aucune"}</Badge></div>
                {gestion && <div className="lg:w-80"><GestionCarte compact membreId={m.membreId} carteId={m.carte?.id ?? null} membreActif={m.statutMembre === "actif"} /></div>}
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">{actives} carte(s) active(s) sur {lignes.length} membre(s)</p>
      </div>
    </>
  );
}
