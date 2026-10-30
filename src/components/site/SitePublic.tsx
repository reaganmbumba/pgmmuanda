/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, BookOpen, Building2, Calendar, CircleCheck, CircleHelp, Clock, Download,
  FilePen, Gavel, HandCoins, IdCard, Scale, ScrollText, UserMinus,
  GraduationCap, HeartHandshake, HeartPulse, Landmark, ListMusic, LogIn, Lock, MapPin, Megaphone,
  MessageCircle, Mic, Music, Network, Newspaper, PenLine, Phone, QrCode, ShieldCheck, Shirt,
  Truck, UserPlus, Users, Wallet, type LucideIcon,
} from "lucide-react";
import { CadreSite } from "./CadreSite";

/*
 * Site public de l'antenne : une page par rubrique. Aucune donnée de membre,
 * seulement l'organisation de l'antenne. Pas de symbole religieux (croix, église) :
 * la doctrine KCCiste est respectée, seul le logo de la PGM est utilisé.
 */

const TELEPHONE = "+243825717444";
const TELEPHONE_AFFICHE = "+243 825 717 444";
const WHATSAPP = `https://wa.me/243825717444?text=${encodeURIComponent(
  "Paix ! Je vous écris depuis le site de la PGM Antenne de Muanda.",
)}`;

const CHORALES = [
  { nom: "Vision", lieu: "Paroisse Atlantique" },
  { nom: "Echo", lieu: "Paroisse Pika Pende" },
  { nom: "Alliance", lieu: "Paroisse Itonde" },
  { nom: "CHOPDI", lieu: "Paroisse Kitsiaku" },
  { nom: "Oracle", lieu: "Chorale urbaine, dans toutes les paroisses" },
];

const SEMAINE: { jour: string; Icone: LucideIcon; seances: { heure: string; quoi: string; Icone: LucideIcon }[] }[] = [
  { jour: "Lundi", Icone: Mic, seances: [
    { heure: "15h30 – 17h30", quoi: "Répétition des femmes", Icone: Clock },
    { heure: "17h30 – 19h30", quoi: "Répétition des hommes", Icone: Clock },
  ] },
  { jour: "Jeudi", Icone: Mic, seances: [
    { heure: "15h30 – 17h30", quoi: "Répétition des femmes", Icone: Clock },
    { heure: "17h30 – 19h30", quoi: "Répétition des hommes", Icone: Clock },
  ] },
  { jour: "Dimanche", Icone: Music, seances: [{ heure: "Culte", quoi: "Louange dans chaque paroisse", Icone: Music }] },
];

const COMMISSIONS: { nom: string; role: string; Icone: LucideIcon }[] = [
  { nom: "Coordination des commissions", role: "Relie le travail de toutes les commissions.", Icone: Network },
  { nom: "Finances & Budget", role: "Cotisations, caisse et budget des activités.", Icone: Wallet },
  { nom: "Uniforme et Tenue", role: "Les uniformes et la tenue lors des productions.", Icone: Shirt },
  { nom: "Logistique & Infrastructure", role: "Matériel, salles, transport et hébergement.", Icone: Truck },
  { nom: "Presse, Communication et Promotion", role: "Annonces, photos, réseaux et ce site.", Icone: Megaphone },
  { nom: "Censure, Musique & Répertoire", role: "Choix et vérification des chants.", Icone: ListMusic },
  { nom: "Santé & Assistance", role: "Soutien aux choristes malades ou dans le besoin.", Icone: HeartPulse },
];

const ETAPES: { titre: string; texte: string; Icone: LucideIcon }[] = [
  { titre: "Être KCCiste", texte: "La chorale est ouverte aux KCCistes de bonne moralité et disponibles.", Icone: IdCard },
  { titre: "La demande", texte: "Écrivez au Comité directeur de la chorale de votre paroisse.", Icone: FilePen },
  { titre: "La moralité", texte: "Le comité vérifie votre bonne moralité.", Icone: ShieldCheck },
  { titre: "Le test de voix", texte: "Vous passez un test d'évaluation.", Icone: Mic },
  { titre: "L'engagement", texte: "Vous signez l'acte d'engagement (sauf pour la chorale junior).", Icone: PenLine },
];

const QUESTIONS: { q: string; r: string }[] = [
  { q: "Qui peut devenir choriste ?",
    r: "Tout KCCiste de bonne moralité et disponible, qui fait une demande écrite au Comité directeur de la chorale de sa paroisse, réussit le test et signe l'acte d'engagement. Les enfants vont dans la chorale junior." },
  { q: "Où trouver le Règlement intérieur ?",
    r: "Dans la rubrique « Règlement » de ce site : un résumé simple et le texte complet à télécharger." },
  { q: "Quand ont lieu les répétitions ?",
    r: "Le lundi et le jeudi : de 15h30 à 17h30 pour les femmes, de 17h30 à 19h30 pour les hommes. Les horaires exacts de chaque chorale sont dans l'espace membres." },
  { q: "Faut-il payer une cotisation ?",
    r: "Oui. Chaque membre paie régulièrement sa cotisation, comme le prévoit le Règlement intérieur. Le montant est donné par votre chorale." },
  { q: "Comment obtenir mon compte dans l'application ?",
    r: "Votre responsable de chorale crée votre compte et vous envoie, par WhatsApp, votre identifiant et un mot de passe provisoire. Aucune adresse e-mail n'est nécessaire." },
  { q: "J'ai oublié mon mot de passe. Que faire ?",
    r: "Sur la page « Se connecter », touchez « Mot de passe oublié ? », ou demandez à votre responsable de chorale de vous en donner un nouveau." },
  { q: "Comment vérifier une carte de membre ?",
    r: "Scannez le code QR de la carte avec l'appareil photo d'un téléphone : une page indique tout de suite si la carte est valable." },
];

/* Les rubriques, dans l'ordre des tuiles de l'accueil. */
const RUBRIQUES: { href: string; nom: string; Icone: LucideIcon }[] = [
  { href: "/la-pgm", nom: "La PGM", Icone: BookOpen },
  { href: "/chorales", nom: "Chorales", Icone: Music },
  { href: "/programme", nom: "Programme", Icone: Calendar },
  { href: "/actualites", nom: "Actualités", Icone: Newspaper },
  { href: "/commissions", nom: "Commissions", Icone: Landmark },
  { href: "/nous-rejoindre", nom: "Nous rejoindre", Icone: UserPlus },
  { href: "/questions", nom: "Questions", Icone: CircleHelp },
  { href: "/contact", nom: "Contact", Icone: Phone },
  { href: "/reglement", nom: "Règlement", Icone: ScrollText },
];

/** Bandeau en haut de chaque rubrique, avec le retour à l'accueil. */
function EnTete({ Icone, titre, texte }: { Icone: LucideIcon; titre: string; texte?: string }) {
  return (
    <section className="page-tete cadre">
      <div className="col">
        <Link className="retour-accueil" href="/"><ArrowLeft className="i" aria-hidden />Accueil</Link>
        <div className="page-titre">
          <span className="rond"><Icone className="i" aria-hidden /></span>
          <h1>{titre}</h1>
        </div>
        {texte && <p>{texte}</p>}
      </div>
    </section>
  );
}

/** Lien vers la rubrique suivante, en bas de page. */
function Suite({ href, nom }: { href: string; nom: string }) {
  return (
    <Link className="suite" href={href}>
      <span><small>Rubrique suivante</small>{nom}</span>
      <ArrowRight className="i" aria-hidden />
    </Link>
  );
}

function CarteArticle() {
  return (
    <Link className="actu" href="/actualites/numerique">
      <div className="vis">
        <img src="/logo-pgm.png" alt="" />
        <b>La PGM Antenne de Muanda passe au numérique</b>
      </div>
      <div className="txt">
        <span className="meta"><Calendar className="i" aria-hidden />Muanda, le 30 octobre 2026</span>
        <p>
          Avec PGM MUANDA DIGITAL, chaque choriste et chaque responsable a son espace personnel pour
          suivre la vie de la PGM depuis son téléphone.
        </p>
        <span className="lire">Lire l&apos;article<ArrowRight className="i" aria-hidden /></span>
      </div>
    </Link>
  );
}

function EspaceMembres() {
  return (
    <div className="appli">
      <div className="titre">
        <div className="tete">
          <span className="pastille pastille-or"><Lock className="i" aria-hidden /></span>
          <span className="etiquette">Réservé aux membres</span>
        </div>
        <h2>Espace membres</h2>
      </div>
      <p>Avec votre identifiant, retrouvez dans l&apos;application PGM MUANDA DIGITAL :</p>
      <div className="atouts">
        <span className="atout"><QrCode className="i" aria-hidden />Ma carte de membre</span>
        <span className="atout"><Calendar className="i" aria-hidden />Le programme</span>
        <span className="atout"><CircleCheck className="i" aria-hidden />Mes présences</span>
        <span className="atout"><ListMusic className="i" aria-hidden />Les chants</span>
      </div>
      <Link className="btn btn-or" href="/connexion"><LogIn className="i" aria-hidden />Se connecter</Link>
      <p className="note">
        Pas encore de compte ? Votre responsable de chorale vous envoie votre identifiant par WhatsApp.
      </p>
    </div>
  );
}

function Bloc({ children }: { children: React.ReactNode }) {
  return <section className="bloc cadre"><div className="col">{children}</div></section>;
}

export function AccueilSite() {
  return (
    <CadreSite>
      <main>
        <section className="une cadre">
          <div className="col">
            <p className="salut">Paix à vous.</p>
            <h1>Servir Dieu par le chant, à Muanda</h1>
            <p className="chapo">
              La Présidence générale de la musique rassemble les chorales de l&apos;EBNM KCC.
              L&apos;Antenne de Muanda en est la représentation locale.
            </p>
            <nav className="raccourcis" aria-label="Rubriques">
              {RUBRIQUES.map(({ href, nom, Icone }) => (
                <Link key={href} className="tuile" href={href}>
                  <span className="rond"><Icone className="i" aria-hidden /></span>
                  {nom}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <div className="chiffres-band cadre">
          <div className="col">
            <div className="chiffres">
              <div><Building2 className="i" aria-hidden /><b>4</b><span>paroisses</span></div>
              <div><Music className="i" aria-hidden /><b>15</b><span>chorales</span></div>
              <div><Landmark className="i" aria-hidden /><b>7</b><span>commissions</span></div>
            </div>
          </div>
        </div>

        <Bloc>
          <div className="titre"><span className="etiquette">À la une</span></div>
          <CarteArticle />
        </Bloc>

        <Bloc><EspaceMembres /></Bloc>
      </main>
    </CadreSite>
  );
}

export function PageLaPgm() {
  return (
    <CadreSite>
      <main>
        <EnTete Icone={BookOpen} titre="La PGM" texte="Une seule famille de chantres, au service de l'EBNM KCC." />
        <Bloc>
          <p>
            La Présidence générale de la musique (PGM) organise la musique de l&apos;EBNM KCC : les
            chorales, la formation des choristes, les répétitions et les productions lors des cultes et
            des grands rassemblements. L&apos;Antenne de Muanda en est la représentation locale.
          </p>
          <p>
            La PGM a été créée le 2 juin 2009 par le Chef spirituel de l&apos;EBNM. Elle suit son Cadre
            général et son Règlement intérieur, signés en 2021, approuvés par l&apos;EBNM KCC en 2022 et
            authentifiés par le Ministère de la Justice en 2024.
          </p>
          <div className="titre"><span className="etiquette">Nos buts</span></div>
          <ul className="puces">
            <li>Garder l&apos;authenticité du style et du rythme de la musique de l&apos;EBNM</li>
            <li>Encadrer les chorales, fanfares, orchestres et groupes instrumentaux</li>
            <li>Former les artistes musiciens, y compris aux instruments authentiques (tambourins, maracas, kingwinzi)</li>
            <li>Vérifier les nouveaux cantiques avant leur apprentissage</li>
            <li>Protéger nos œuvres contre la piraterie</li>
          </ul>
          <div className="dirigeant">
            <div>
              <small>Président général</small>
              <b>Rév. Apôtre NDANGI MAKWALA Etienne-Oscar</b>
              <p className="note">Siège : Masina, Kinshasa</p>
            </div>
          </div>
          <div className="titre"><span className="etiquette">Nos valeurs</span></div>
          <div className="valeurs">
            <div className="valeur"><span className="ic"><Music className="i" aria-hidden /></span><div><h3>La louange</h3><p>Chanter pour Dieu au culte du dimanche et lors des activités de l&apos;antenne.</p></div></div>
            <div className="valeur"><span className="ic"><GraduationCap className="i" aria-hidden /></span><div><h3>La formation</h3><p>Apprendre le solfège, les voix et le répertoire, du chantre débutant au chef de chœur.</p></div></div>
            <div className="valeur"><span className="ic"><HeartHandshake className="i" aria-hidden /></span><div><h3>La fraternité</h3><p>S&apos;entraider entre choristes, dans la discipline et le respect de chacun.</p></div></div>
          </div>
          <div className="titre"><span className="etiquette">Nos membres</span></div>
          <div className="valeurs">
            <div className="valeur"><span className="ic"><Users className="i" aria-hidden /></span><div><h3>Membre actif</h3><p>Chante ou joue dans une chorale et paie ses cotisations.</p></div></div>
            <div className="valeur"><span className="ic"><Landmark className="i" aria-hidden /></span><div><h3>Membre effectif</h3><p>Exerce une fonction dans l&apos;organisation de la PGM.</p></div></div>
          </div>
          <Link className="btn btn-marine" href="/reglement"><ScrollText className="i" aria-hidden />Lire le Règlement intérieur</Link>
          <Suite href="/chorales" nom="Nos chorales" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export function PageChorales() {
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Music} titre="Nos chorales"
          texte="Cinq groupes, quinze chorales. Chaque groupe a une chorale de femmes, une d'hommes et une chorale junior." />
        <Bloc>
          <div className="chorales">
            {CHORALES.map((c) => (
              <div key={c.nom} className="chorale">
                <span className="ini">{c.nom[0]}</span>
                <div>
                  <h3>{c.nom}</h3>
                  <p className="lieu"><MapPin className="i" aria-hidden />{c.lieu}</p>
                  <div className="voix"><span>Femme</span><span>Homme</span><span>Junior</span></div>
                </div>
              </div>
            ))}
          </div>
          <p className="note">Pour rejoindre une chorale, adressez-vous à son Comité directeur dans votre paroisse.</p>
          <Suite href="/programme" nom="Le programme" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export function PageProgramme() {
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Calendar} titre="Programme" texte="Horaires habituels de la semaine, selon le Règlement intérieur." />
        <Bloc>
          <div className="semaine">
            {SEMAINE.map(({ jour, Icone, seances }) => (
              <div key={jour} className="jour">
                <div className="j"><Icone className="i" aria-hidden /><b>{jour}</b></div>
                <ul>
                  {seances.map((s) => (
                    <li key={s.quoi}>
                      <s.Icone className="i" aria-hidden />
                      <div><time>{s.heure}</time><span>{s.quoi}</span></div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="note">
            Les horaires précis de chaque chorale, les concerts et les déplacements sont publiés dans
            l&apos;espace membres.
          </p>
          <Suite href="/actualites" nom="Actualités" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export function PageActualites() {
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Newspaper} titre="Actualités" texte="Les nouvelles de la PGM Antenne de Muanda." />
        <Bloc>
          <CarteArticle />
          <Suite href="/commissions" nom="Nos commissions" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export function PageCommissions() {
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Landmark} titre="Nos commissions" texte="Sept commissions font fonctionner l'antenne." />
        <Bloc>
          <ul className="commissions">
            {COMMISSIONS.map(({ nom, role, Icone }) => (
              <li key={nom}>
                <span className="ic"><Icone className="i" aria-hidden /></span>
                <div><h3>{nom}</h3><span>{role}</span></div>
              </li>
            ))}
          </ul>
          <Suite href="/nous-rejoindre" nom="Nous rejoindre" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export function PageRejoindre() {
  return (
    <CadreSite>
      <main>
        <EnTete Icone={UserPlus} titre="Devenir choriste" texte="Les étapes prévues par le Règlement intérieur." />
        <Bloc>
          <ol className="etapes">
            {ETAPES.map(({ titre, texte, Icone }, i) => (
              <li key={titre}>
                <span className="ic"><Icone className="i" aria-hidden /><span className="num">{i + 1}</span></span>
                <div><h3>{titre}</h3><p>{texte}</p></div>
              </li>
            ))}
          </ol>
          <p className="note">
            Une fois membre, vous participez aux répétitions, vous payez régulièrement vos cotisations et
            vous recevez votre carte de membre avec code QR.
          </p>
          <a className="btn btn-vert" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="i" aria-hidden />Poser une question sur WhatsApp
          </a>
          <p className="note">
            La PGM compte aussi la fanfare, les orchestres et les groupes flûte, avec leurs propres
            conditions d&apos;adhésion.
          </p>
          <Link className="btn btn-marine" href="/reglement"><ScrollText className="i" aria-hidden />Lire le Règlement intérieur</Link>
          <Suite href="/reglement" nom="Règlement intérieur" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export function PageQuestions() {
  return (
    <CadreSite>
      <main>
        <EnTete Icone={CircleHelp} titre="Questions fréquentes" texte="Touchez une question pour voir la réponse." />
        <Bloc>
          <div className="faq">
            {QUESTIONS.map(({ q, r }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{r}</p>
              </details>
            ))}
          </div>
          <Suite href="/contact" nom="Contact" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

/* Résumé du Règlement intérieur (texte de mars 2022), article par article. */
const REGLEMENT: { titre: string; articles: string; Icone: LucideIcon; points: string[] }[] = [
  { titre: "Qui est membre ?", articles: "Articles 1 à 3", Icone: Users, points: [
    "Membre effectif : tout KCCiste qui exerce une fonction dans la PGM.",
    "Membre actif : tout KCCiste qui chante ou joue dans un des groupes de la PGM.",
  ] },
  { titre: "Mes droits", articles: "Articles 2 et 3", Icone: HandCoins, points: [
    "L'assistance sociale des artistes musiciens.",
    "La formation musicale si nécessaire.",
    "L'uniforme du groupe.",
    "Le transport et le repas lors des déplacements du groupe.",
  ] },
  { titre: "Mes obligations", articles: "Articles 2 et 3", Icone: CircleCheck, points: [
    "Respecter le Cadre général et le Règlement intérieur.",
    "Payer régulièrement ses cotisations.",
    "Être disponible.",
  ] },
  { titre: "Entrer dans une chorale", articles: "Article 4", Icone: UserPlus, points: [
    "Être KCCiste, de bonne moralité et disponible.",
    "Faire une demande écrite au Comité directeur.",
    "Réussir le test d'évaluation.",
    "Signer l'acte d'engagement (pas pour la chorale junior).",
  ] },
  { titre: "Les répétitions", articles: "Article 41", Icone: Calendar, points: [
    "Femmes : lundi et jeudi, de 15h30 à 17h30.",
    "Hommes : lundi et jeudi, de 17h30 à 19h30.",
    "Un ou deux jours de plus peuvent être demandés pour préparer un événement.",
  ] },
  { titre: "Ce qui n'est pas toléré", articles: "Article 27", Icone: Scale, points: [
    "L'absence ou le retard non justifié aux répétitions et productions.",
    "La désobéissance, la grossièreté, le désordre ou la violence.",
    "La tenue indécente.",
    "Le refus de payer ses cotisations ou de chanter sans raison valable.",
    "La piraterie et la vente illicite des œuvres de la PGM.",
  ] },
  { titre: "Les sanctions", articles: "Articles 24 à 26", Icone: Gavel, points: [
    "Dans l'ordre : avertissement, blâme, suspension, exclusion.",
    "Tout membre est présumé innocent jusqu'à la décision.",
    "Aucune sanction sans avoir entendu la défense du membre.",
    "L'uniforme se porte seulement pendant la production.",
  ] },
  { titre: "Perdre la qualité de membre", articles: "Article 16", Icone: UserMinus, points: [
    "Par décès, exclusion, démission.",
    "Par absence prolongée et non justifiée.",
    "Par démérite ou incompatibilité.",
  ] },
];

export function PageReglement() {
  return (
    <CadreSite>
      <main>
        <EnTete Icone={ScrollText} titre="Règlement intérieur"
          texte="Les règles de vie de la PGM, expliquées simplement. Touchez un thème pour le lire." />
        <Bloc>
          <div className="faq regles">
            {REGLEMENT.map(({ titre, articles, Icone, points }) => (
              <details key={titre}>
                <summary>
                  <span className="ic"><Icone className="i" aria-hidden /></span>
                  <span>{titre}<small>{articles}</small></span>
                </summary>
                <ul className="puces">{points.map((p) => <li key={p}>{p}</li>)}</ul>
              </details>
            ))}
          </div>
          <div className="titre"><span className="etiquette">Textes complets</span></div>
          <div className="telechargements">
            <a className="btn btn-marine" href="/textes/PGM-Reglement-interieur.pdf" target="_blank" rel="noopener">
              <Download className="i" aria-hidden />Règlement intérieur (PDF)
            </a>
            <a className="btn btn-ligne-sombre" href="/textes/PGM-Cadre-general.pdf" target="_blank" rel="noopener">
              <Download className="i" aria-hidden />Cadre général (PDF)
            </a>
          </div>
          <p className="note">
            Ce résumé aide à comprendre les textes, il ne les remplace pas. Les textes complets ont été
            signés le 20 novembre 2021 ; seul l&apos;original signé fait foi.
          </p>
          <Suite href="/questions" nom="Questions fréquentes" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export function PageContact() {
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Phone} titre="Contact" texte="Une question ? Écrivez-nous ou appelez-nous." />
        <Bloc>
          <div className="contact-actions">
            <a className="c-btn" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
              <span className="rond wa"><MessageCircle className="i" aria-hidden /></span>WhatsApp<small>Écrire un message</small>
            </a>
            <a className="c-btn" href={`tel:${TELEPHONE}`}>
              <span className="rond tel"><Phone className="i" aria-hidden /></span>Appeler<small>{TELEPHONE_AFFICHE}</small>
            </a>
          </div>
          <div className="carte lignes">
            <div className="ligne-c"><span className="ic"><Phone className="i" aria-hidden /></span><div><small>Téléphone et WhatsApp</small>{TELEPHONE_AFFICHE}</div></div>
            <div className="ligne-c"><span className="ic"><MapPin className="i" aria-hidden /></span><div><small>Lieu</small>Muanda, Kongo-Central, RD Congo</div></div>
            <div className="ligne-c"><span className="ic"><Users className="i" aria-hidden /></span><div><small>Questions sur une chorale</small>Adressez-vous au responsable de la chorale de votre paroisse.</div></div>
          </div>
          <EspaceMembres />
        </Bloc>
      </main>
    </CadreSite>
  );
}
