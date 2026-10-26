import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { exigerAcces } from "@/lib/auth/session";
import { estAdmin, peutGererMembres } from "@/lib/auth/roles";
import { formatDate, formatDateHeure } from "@/lib/format";
import { comptesNonRelies, lireDemandes, lireHistorique, lireMembre, lireOrganisation } from "@/lib/membres/depot";
import { CHAMPS_CORRIGEABLES, CHAMPS_MEMBRE, STATUTS, STATUTS_DEMANDE, TYPES_HISTORIQUE, VOIX } from "@/lib/membres/libelles";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { ActionsStatut, RelierCompte, TraiterDemande } from "./ActionsFiche";

export const metadata = { title: "Fiche membre" };

export default async function FicheMembrePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ enregistre?: string }>;
}) {
  if (!supabaseActif) redirect("/staff/membres");
  const { id } = await params;
  const moi = await exigerAcces("/staff/membres");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const membre = await lireMembre(id);
  if (!membre) notFound();

  const gestion = peutGererMembres(moi?.role);
  const admin = estAdmin(moi?.role);
  const [historique, demandes, organisation, comptes] = await Promise.all([
    lireHistorique(id),
    gestion ? lireDemandes({ membreId: id }) : Promise.resolve([]),
    lireOrganisation(),
    admin ? comptesNonRelies() : Promise.resolve([]),
  ]);
  let compteActuel: string | null = null;
  if (admin && membre.profilId) {
    const supabase = await creerClientServeur();
    const { data } = await supabase.from("profils").select("nom_affiche, identifiant").eq("id", membre.profilId).maybeSingle();
    compteActuel = data ? `${data.nom_affiche}${data.identifiant ? ` (${data.identifiant})` : ""}` : null;
  }

  const noms = new Map<string, string>([
    ...organisation.paroisses.map((p) => [p.id, p.nom] as [string, string]),
    ...organisation.chorales.map((c) => [c.id, c.nom] as [string, string]),
  ]);
  const valeur = (champ: string, v: unknown): string => {
    if (v === null || v === undefined || v === "") return "—";
    if (champ === "voix") return VOIX[v as keyof typeof VOIX] ?? String(v);
    if (champ === "statut") return STATUTS[v as keyof typeof STATUTS] ?? String(v);
    if (champ === "paroisse_id" || champ === "chorale_id") return noms.get(String(v)) ?? "—";
    if (champ === "archive") return v ? "Oui" : "Non";
    if (champ === "profil_id") return "compte relié";
    if (champ === "date_adhesion") return formatDate(String(v));
    return String(v);
  };

  const lignes: [string, string][] = [
    ["Matricule", membre.matricule],
    ["Nom et postnom", `${membre.nom} ${membre.postnom}`.trim()],
    ["Prénom", membre.prenom],
    ["Sexe", membre.sexe === "F" ? "Femme" : membre.sexe === "M" ? "Homme" : "—"],
    ["Téléphone", membre.telephone || "—"],
    ["Adresse e-mail", membre.email || "—"],
    ["Paroisse", membre.paroisse],
    ["Chorale", membre.chorale || "—"],
    ["Voix", membre.voix || "—"],
    ["Fonction", membre.fonction],
    ["Date d'adhésion", formatDate(membre.dateAdhesion)],
  ];
  const enAttente = demandes.filter((d) => d.statut === "en_attente");

  return (
    <div className="space-y-5">
      <Link href="/staff/membres" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-marine-900">
        <ArrowLeft className="size-4" aria-hidden /> Membres
      </Link>
      {(await searchParams).enregistre && (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Fiche enregistrée.</p>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <Avatar membre={membre} taille="lg" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-marine-900">
            {membre.prenom} {membre.nom} {membre.postnom}
            {membre.estDemo && <span className="ml-2 text-sm font-normal text-or-600">(démo)</span>}
          </h1>
          <p className="font-mono text-sm font-semibold text-marine-700">{membre.matricule}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{membre.statut}</Badge>
            {membre.archive && <Badge ton="gris">Archivé</Badge>}
          </div>
        </div>
        {gestion && !membre.archive && (
          <Bouton variante="secondaire" href={`/staff/membres/${id}/modifier`}>
            <Pencil className="size-4" aria-hidden /> Modifier
          </Bouton>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Carte titre="Informations">
            <dl className="divide-y divide-slate-100 text-sm">
              {lignes.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-medium text-marine-900">{v}</dd>
                </div>
              ))}
            </dl>
          </Carte>

          {gestion && (
            <section id="demandes">
              <Carte titre={`Demandes de correction${enAttente.length ? ` (${enAttente.length} en attente)` : ""}`}>
                {demandes.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune demande.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {demandes.map((d) => (
                      <li key={d.id} className="space-y-2 py-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p>
                            <span className="text-slate-500">{CHAMPS_CORRIGEABLES[d.champ as keyof typeof CHAMPS_CORRIGEABLES] ?? d.champ} :</span>{" "}
                            <strong className="text-marine-900">{d.champ === "voix" ? valeur("voix", d.valeur) : d.valeur}</strong>
                          </p>
                          <Badge ton={d.statut === "acceptee" ? "vert" : d.statut === "refusee" ? "rouge" : "ambre"}>{STATUTS_DEMANDE[d.statut]}</Badge>
                        </div>
                        {d.motif && <p className="text-slate-600">« {d.motif} »</p>}
                        <p className="text-xs text-slate-400">Demandée le {formatDateHeure(d.date)}</p>
                        <TraiterDemande id={d.id} enAttente={d.statut === "en_attente"} />
                      </li>
                    ))}
                  </ul>
                )}
              </Carte>
            </section>
          )}

          <Carte titre="Historique">
            {historique.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun événement.</p>
            ) : (
              <ol className="space-y-4">
                {historique.map((h) => (
                  <li key={h.id} className="border-l-2 border-or-400 pl-4 text-sm">
                    <p className="font-semibold text-marine-900">{TYPES_HISTORIQUE[h.type] ?? h.type}</p>
                    <p className="text-xs text-slate-500">{formatDateHeure(h.date)} · {h.auteur}</p>
                    {h.type === "creation" ? (
                      <p className="mt-1 text-slate-600">Matricule attribué : {String(h.apres?.matricule ?? "")}</p>
                    ) : (
                      <ul className="mt-1 space-y-0.5 text-slate-600">
                        {Object.keys(h.apres ?? {}).map((c) => (
                          <li key={c}>
                            {CHAMPS_MEMBRE[c] ?? c} : <span className="line-through decoration-slate-400">{valeur(c, h.avant?.[c])}</span> → <strong className="text-marine-900">{valeur(c, h.apres?.[c])}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Carte>
        </div>

        <div className="space-y-5">
          {gestion && (
            <Carte titre="Statut">
              <ActionsStatut id={id} statut={membre.statutCode} archive={membre.archive} />
            </Carte>
          )}
          {admin && (
            <Carte titre="Compte de connexion">
              <RelierCompte id={id} profilId={membre.profilId} compteActuel={compteActuel} comptes={comptes} />
            </Carte>
          )}
        </div>
      </div>
    </div>
  );
}
