/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ExternalLink, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { ActionConfirmee } from "@/components/ui/ActionConfirmee";
import { Badge } from "@/components/ui/Badge";
import { Carte, EnTete } from "@/components/ui/Carte";
import { Champ, Vide } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide, Repliable } from "@/components/ui/FormulaireRapide";
import { exigerAcces } from "@/lib/auth/session";
import { dateLongue, lireCauserie, lireElements, lireReglages, siteEnBase, urlFichier, type ElementSite, type Rubrique } from "@/lib/site/contenu";
import { basculerElement, enregistrerElement, enregistrerReglages, masquerMessage, supprimerElement, supprimerMessage } from "./actions";
import { EnvoiAudio } from "./EnvoiAudio";
import { ChampImage } from "./ChampImage";

const BASE_FICHIERS = urlFichier("").replace(/\/$/, "");

export const metadata = { title: "Site public" };

type Libelles = { nom: string; un: string; titre: string; sousTitre?: string; texte?: string; date?: boolean; ordre?: boolean; image?: boolean; page: string };

/** Ce que veut dire chaque champ selon la rubrique. */
const RUBRIQUES: Record<Rubrique, Libelles> = {
  actualite: { nom: "Actualités", un: "une actualité", titre: "Titre", sousTitre: "Résumé (affiché dans la liste)", texte: "Texte de l'article (une ligne vide entre deux paragraphes)", date: true, image: true, page: "/actualites" },
  audio: { nom: "Audios des répétitions", un: "un audio", titre: "Titre du chant", sousTitre: "Chorale", texte: "Remarque", date: true, page: "/ecouter" },
  chorale: { nom: "Chorales", un: "une chorale", titre: "Nom de la chorale", sousTitre: "Paroisse", ordre: true, page: "/chorales" },
  programme: { nom: "Programme de la semaine", un: "une ligne du programme", titre: "Jour (ex. Lundi)", sousTitre: "Heure (ex. 15h30 – 17h30)", texte: "Activité", ordre: true, page: "/programme" },
  commission: { nom: "Commissions", un: "une commission", titre: "Nom de la commission", texte: "Son rôle, en une phrase", ordre: true, page: "/commissions" },
  question: { nom: "Questions fréquentes", un: "une question", titre: "Question", texte: "Réponse", ordre: true, page: "/questions" },
  soiree: { nom: "Soirées musicales", un: "une soirée musicale", titre: "Nom de la soirée", sousTitre: "Heure et lieu (ex. 18h, paroisse Atlantique)", texte: "Présentation (chorales invitées, programme…)", date: true, image: true, page: "/soirees" },
  social: { nom: "Cas sociaux", un: "un cas social", titre: "Titre (ex. Deuil dans la famille de…)", sousTitre: "Chorale ou paroisse", texte: "Message (une ligne vide entre deux paragraphes)", date: true, image: true, page: "/cas-sociaux" },
  pionnier: { nom: "Les pionniers", un: "un pionnier", titre: "Nom du pionnier", sousTitre: "Rôle ou années (ex. 1er président, 1985 – 1998)", texte: "Son histoire (une ligne vide entre deux paragraphes)", ordre: true, image: true, page: "/pionniers" },
};
type Onglet = Rubrique | "causerie" | "reglages";
const ONGLETS: Onglet[] = ["actualite", "soiree", "audio", "social", "pionnier", "chorale", "programme", "commission", "question", "causerie", "reglages"];
const NOM_ONGLET = (o: Onglet) => o === "reglages" ? "Accueil et contact" : o === "causerie" ? "Causerie" : RUBRIQUES[o].nom;

function Champs({ l, e }: { l: Libelles; e?: ElementSite }) {
  const long = (l.texte?.length ?? 0) > 30;
  return (
    <>
      <Champ libelle={`${l.titre} *`} className={l.sousTitre ? "" : "sm:col-span-2"}>
        <input name="titre" required maxLength={200} defaultValue={e?.titre} className={classeChamp} />
      </Champ>
      {l.sousTitre && <Champ libelle={l.sousTitre}><input name="sousTitre" maxLength={200} defaultValue={e?.sousTitre ?? ""} className={classeChamp} /></Champ>}
      {l.texte && (
        <Champ libelle={l.texte} className="sm:col-span-2">
          {long || e?.rubrique === "question"
            ? <textarea name="texte" rows={long ? 8 : 3} maxLength={20000} defaultValue={e?.texte ?? ""} className={classeChamp} />
            : <input name="texte" maxLength={500} defaultValue={e?.texte ?? ""} className={classeChamp} />}
        </Champ>
      )}
      {l.date && <Champ libelle="Date"><input name="date" type="date" defaultValue={e?.date ?? ""} className={classeChamp} /></Champ>}
      {l.image && <ChampImage chemin={e?.image ?? null} base={BASE_FICHIERS} />}
      {l.ordre && <Champ libelle="Position dans la liste" aide="Les plus petits numéros s'affichent en premier."><input name="ordre" type="number" min={0} max={9999} defaultValue={e?.ordre ?? 0} className={classeChamp} /></Champ>}
    </>
  );
}

function Element({ e, l }: { e: ElementSite; l: Libelles }) {
  return (
    <li className={`py-4 ${e.publie ? "" : "opacity-70"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {e.image && <img src={urlFichier(e.image)} alt="" className="mb-2 h-16 w-28 rounded-lg object-cover" />}
          <p className="font-semibold text-marine-900">{e.titre} {!e.publie && <Badge ton="gris">Masqué</Badge>}</p>
          <p className="text-sm text-slate-600">{[e.sousTitre, e.date && dateLongue(e.date)].filter(Boolean).join(" · ")}</p>
          {e.texte && e.rubrique !== "actualite" && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{e.texte}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionConfirmee action={basculerElement} champs={{ id: e.id, publie: e.publie ? "non" : "oui" }}
            icone={e.publie ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            libelle={e.publie ? "Masquer" : "Afficher"} question={e.publie ? "Masquer cet élément du site public ?" : "Afficher de nouveau cet élément sur le site ?"} />
          <ActionConfirmee action={supprimerElement} champs={{ id: e.id }} danger icone={<Trash2 className="size-4" aria-hidden />}
            libelle="Supprimer" question={`Supprimer définitivement « ${e.titre} »${e.fichier ? " et son fichier audio" : ""} ?`} />
        </div>
      </div>
      {e.fichier && <audio controls preload="none" src={urlFichier(e.fichier)} className="mt-3 h-10 w-full max-w-md" />}
      <details className="mt-2">
        <summary className="cursor-pointer text-sm font-medium text-or-600">Modifier</summary>
        <div className="mt-3">
          <FormulaireRapide action={enregistrerElement} champs={{ id: e.id, rubrique: e.rubrique }} garder libelle="Enregistrer" icone={<Save className="size-4" aria-hidden />}>
            <Champs l={l} e={e} />
          </FormulaireRapide>
        </div>
      </details>
    </li>
  );
}

export default async function PageSite({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  await exigerAcces("/staff/site");
  const { r } = await searchParams;
  const onglet = ONGLETS.find((o) => o === r) ?? "actualite";
  const description = "Tout ce que le public voit sur pgmmuanda.com : ajoutez, modifiez, masquez ou supprimez.";
  const [enBase, reglages] = await Promise.all([siteEnBase(), lireReglages()]);

  const barre = (
    <nav className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Rubriques du site">
      {ONGLETS.map((o) => (
        <Link key={o} href={`/staff/site?r=${o}`} aria-current={o === onglet ? "page" : undefined}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${o === onglet ? "bg-marine-900 text-white" : "border border-slate-200 bg-white text-marine-900"}`}>
          {NOM_ONGLET(o)}
        </Link>
      ))}
    </nav>
  );

  if (!enBase) {
    return (<><EnTete titre="Site public" description={description} />
      <Vide>La base de données n&apos;a pas encore les tables du site public. Exécutez la mise à jour « 20261109000100_site_public.sql » dans Supabase, puis revenez ici.</Vide></>);
  }

  if (onglet === "reglages") {
    return (
      <>
        <EnTete titre="Site public" description={description} />
        {barre}
        <Carte titre="Accueil, contact et chaîne YouTube">
          <FormulaireRapide action={enregistrerReglages} garder libelle="Enregistrer" icone={<Save className="size-4" aria-hidden />}>
            <Champ libelle="Grand titre de l'accueil *" className="sm:col-span-2"><input name="accueil_titre" required maxLength={200} defaultValue={reglages.accueil_titre} className={classeChamp} /></Champ>
            <Champ libelle="Texte de l'accueil *" className="sm:col-span-2"><textarea name="accueil_texte" required rows={3} maxLength={2000} defaultValue={reglages.accueil_texte} className={classeChamp} /></Champ>
            <Champ libelle="Téléphone et WhatsApp *"><input name="telephone" required maxLength={20} defaultValue={reglages.telephone} className={classeChamp} /></Champ>
            <Champ libelle="Message WhatsApp déjà écrit"><input name="whatsapp_message" maxLength={500} defaultValue={reglages.whatsapp_message} className={classeChamp} /></Champ>
            <Champ libelle="Causerie">
              <select name="causerie_ouverte" defaultValue={reglages.causerie_ouverte} className={classeChamp}>
                <option value="oui">Ouverte : tout le monde peut écrire</option>
                <option value="non">Fermée : on peut lire, plus personne n&apos;écrit</option>
              </select>
            </Champ>
            <Champ libelle="Nom de la chaîne YouTube *" aide="Ce qui suit youtube.com/@"><input name="youtube_chaine" required maxLength={100} defaultValue={reglages.youtube_chaine} className={classeChamp} /></Champ>
            <Champ libelle="Identifiant de la chaîne (facultatif)" aide="Commence par UC. Seulement si les vidéos ne s'affichent pas."><input name="youtube_id" maxLength={24} defaultValue={reglages.youtube_id} className={classeChamp} /></Champ>
          </FormulaireRapide>
        </Carte>
      </>
    );
  }

  if (onglet === "causerie") {
    const messages = await lireCauserie();
    return (
      <>
        <EnTete titre="Site public" description={description} />
        {barre}
        <Carte titre={`Causerie : derniers messages (${reglages.causerie_ouverte === "oui" ? "ouverte" : "fermée"})`}
          action={<a href="/causerie" target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-or-600">Voir sur le site<ExternalLink className="size-4" aria-hidden /></a>}>
          <p className="mb-3 text-sm text-slate-600">Masquez ou supprimez un message déplacé. Pour fermer la causerie, allez dans « Accueil et contact ».</p>
          {messages.length === 0 ? <p className="text-sm text-slate-500">Aucun message.</p> : (
            <ul className="divide-y divide-slate-100">
              {messages.map((m) => (
                <li key={m.id} className={`flex flex-wrap items-start justify-between gap-3 py-3 ${m.masque ? "opacity-60" : ""}`}>
                  <div className="min-w-0">
                    <p className="text-sm"><b className="text-marine-900">{m.pseudo}</b> <span className="text-xs text-slate-500">{new Date(m.creeLe).toLocaleString("fr-FR", { timeZone: "Africa/Kinshasa", dateStyle: "short", timeStyle: "short" })}</span> {m.masque && <Badge ton="gris">Masqué</Badge>}</p>
                    <p className="text-sm text-slate-700 break-words">{m.texte}</p>
                  </div>
                  <div className="flex gap-2">
                    <ActionConfirmee action={masquerMessage} champs={{ id: String(m.id), masque: m.masque ? "non" : "oui" }}
                      libelle={m.masque ? "Réafficher" : "Masquer"} question={m.masque ? "Réafficher ce message ?" : "Masquer ce message pour tout le monde ?"} />
                    <ActionConfirmee action={supprimerMessage} champs={{ id: String(m.id) }} danger icone={<Trash2 className="size-4" aria-hidden />}
                      libelle="Supprimer" question="Supprimer définitivement ce message ?" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </>
    );
  }

  const l = RUBRIQUES[onglet];
  const elements = await lireElements(onglet, true);
  const chorales = onglet === "audio" ? [...new Set([...(await lireElements("chorale")).map((c) => c.titre), ...elements.map((e) => e.sousTitre ?? "")].filter(Boolean))] : [];
  return (
    <>
      <EnTete titre="Site public" description={description} />
      {barre}
      <div className="mb-6">
        <Repliable titre={`Ajouter ${l.un}`}>
          {onglet === "audio" ? <EnvoiAudio chorales={chorales} /> : (
            <FormulaireRapide action={enregistrerElement} champs={{ rubrique: onglet }} libelle="Ajouter au site" icone={<Plus className="size-4" aria-hidden />}>
              <Champs l={l} />
            </FormulaireRapide>
          )}
        </Repliable>
      </div>
      <Carte titre={l.nom} action={<a href={l.page} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-or-600">Voir sur le site<ExternalLink className="size-4" aria-hidden /></a>}>
        {elements.length === 0 ? <p className="text-sm text-slate-500">Rien pour le moment. Utilisez « Ajouter » ci-dessus.</p> : (
          <ul className="divide-y divide-slate-100">{elements.map((e) => <Element key={e.id} e={e} l={l} />)}</ul>
        )}
      </Carte>
    </>
  );
}
