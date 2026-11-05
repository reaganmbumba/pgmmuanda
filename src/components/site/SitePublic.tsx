/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, BookOpen, Building2, Calendar, CircleCheck, CircleHelp, Clock, Download,
  FilePen, Gavel, HandCoins, IdCard, Scale, ScrollText, UserMinus,
  GraduationCap, HeartHandshake, HeartPulse, Landmark, ListMusic, LogIn, Lock, MapPin, Megaphone,
  MessageCircle, Mic, Music, Network, Newspaper, PenLine, Phone, QrCode, ShieldCheck, Shirt,
  Truck, UserPlus, Users, Wallet, Radio, Headphones, Play, TvMinimalPlay, BellRing, CalendarHeart, MessagesSquare, Medal, HandHeart, Menu, type LucideIcon,
} from "lucide-react";
import { CadreSite } from "./CadreSite";
import { LecteurVideo } from "./LecteurVideo";
import { Partage } from "./Partage";
import { GuetteurDirect } from "./GuetteurDirect";
import { Causerie } from "./Causerie";
import { Apparition } from "./Apparition";
import {
  contact, dateLongue, lireElement, lireElements, lireReglages, paragraphes, siteEnBase, urlFichier, type ElementSite,
} from "@/lib/site/contenu";
import { lireChaine } from "@/lib/site/youtube";

/*
 * Site public de l'antenne : une page par rubrique. Aucune donnée de membre,
 * seulement l'organisation de l'antenne. Pas de symbole religieux (croix, église) :
 * la doctrine KCCiste est respectée, seul le logo de la PGM est utilisé.
 */

/** Icône d'une commission d'après son nom (une icône neutre sinon). */
function iconeCommission(nom: string): LucideIcon {
  const n = nom.toLowerCase();
  if (n.includes("coordination")) return Network;
  if (n.includes("financ") || n.includes("budget")) return Wallet;
  if (n.includes("uniforme") || n.includes("tenue")) return Shirt;
  if (n.includes("logistique")) return Truck;
  if (n.includes("presse") || n.includes("communication")) return Megaphone;
  if (n.includes("musique") || n.includes("répertoire") || n.includes("censure")) return ListMusic;
  if (n.includes("santé") || n.includes("assistance")) return HeartPulse;
  return Landmark;
}

const ETAPES: { titre: string; texte: string; Icone: LucideIcon }[] = [
  { titre: "Être KCCiste", texte: "La chorale est ouverte aux KCCistes de bonne moralité et disponibles.", Icone: IdCard },
  { titre: "La demande", texte: "Écrivez au Comité directeur de la chorale de votre paroisse.", Icone: FilePen },
  { titre: "La moralité", texte: "Le comité vérifie votre bonne moralité.", Icone: ShieldCheck },
  { titre: "Le test de voix", texte: "Vous passez un test d'évaluation.", Icone: Mic },
  { titre: "L'engagement", texte: "Vous signez l'acte d'engagement (sauf pour la chorale junior).", Icone: PenLine },
];

/* Les rubriques, dans l'ordre des tuiles de l'accueil. */
export const RUBRIQUES: { href: string; nom: string; Icone: LucideIcon }[] = [
  { href: "/direct", nom: "Direct", Icone: Radio },
  { href: "/ecouter", nom: "Écouter", Icone: Headphones },
  { href: "/causerie", nom: "Causerie", Icone: MessagesSquare },
  { href: "/soirees", nom: "Soirées musicales", Icone: CalendarHeart },
  { href: "/la-pgm", nom: "La PGM", Icone: BookOpen },
  { href: "/chorales", nom: "Chorales", Icone: Music },
  { href: "/programme", nom: "Programme", Icone: Calendar },
  { href: "/actualites", nom: "Actualités", Icone: Newspaper },
  { href: "/commissions", nom: "Commissions", Icone: Landmark },
  { href: "/cas-sociaux", nom: "Cas sociaux", Icone: HandHeart },
  { href: "/pionniers", nom: "Les pionniers", Icone: Medal },
  { href: "/nous-rejoindre", nom: "Nous rejoindre", Icone: UserPlus },
  { href: "/questions", nom: "Questions", Icone: CircleHelp },
  { href: "/contact", nom: "Contact", Icone: Phone },
  { href: "/reglement", nom: "Règlement", Icone: ScrollText },
  { href: "/connexion", nom: "Se connecter", Icone: LogIn },
];

/* Sur l'accueil, seulement six grandes tuiles ; le reste est dans « Toutes les rubriques ». */
const PRINCIPALES = ["/direct", "/ecouter", "/soirees", "/actualites", "/chorales", "/causerie"];

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

function CarteArticle({ a }: { a: ElementSite }) {
  return (
    <div className="actu-bloc">
      <Link className="actu" href={`/actualites/${a.id}`}>
        {a.image ? (
          <div className={a.affiche ? "vis photo affiche" : "vis photo"}>
            <img src={urlFichier(a.image)} alt="" loading="lazy" />
            <b>{a.titre}</b>
          </div>
        ) : (
          <div className="vis">
            <img src="/logo-pgm.png" alt="" />
            <b>{a.titre}</b>
          </div>
        )}
        <div className="txt">
          {a.date && <span className="meta"><Calendar className="i" aria-hidden />Muanda, le {dateLongue(a.date)}</span>}
          {a.sousTitre && <p>{a.sousTitre}</p>}
          <span className="lire">Lire l&apos;article<ArrowRight className="i" aria-hidden /></span>
        </div>
      </Link>
      <Partage compact texte={a.titre} chemin={`/actualites/${a.id}`} image={a.image ? urlFichier(a.image) : null} />
    </div>
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

/** Titre de section de l'accueil : petite étiquette dorée, grand titre, lien « voir tout » facultatif. */
function TitreSection({ etiquette, titre, lien }: { etiquette: string; titre: string; lien?: { href: string; nom: string } }) {
  return (
    <div className="titre-section">
      <div>
        <span className="etiquette">{etiquette}</span>
        <h2>{titre}</h2>
      </div>
      {lien && <Link className="voir-tout" href={lien.href}>{lien.nom}<ArrowRight className="i" aria-hidden /></Link>}
    </div>
  );
}

/* Une phrase sous chaque grande tuile de l'accueil. */
const DESCRIPTIONS: Record<string, string> = {
  "/direct": "Cultes et louanges en vidéo",
  "/ecouter": "Les audios des répétitions",
  "/soirees": "Nos prochains rendez-vous",
  "/actualites": "Communiqués et nouvelles",
  "/chorales": "Nos groupes et nos paroisses",
  "/causerie": "Discuter avec l'antenne",
};

/** Ondes sonores dorées en fond du grand bandeau (décor musical, sans symbole religieux). */
function Ondes() {
  const barres = [18, 34, 52, 30, 64, 88, 58, 40, 76, 104, 70, 46, 90, 120, 84, 56, 98, 72, 44, 66, 38, 24, 48, 30, 16];
  return (
    <svg className="ondes" viewBox="0 0 500 140" aria-hidden preserveAspectRatio="xMidYMid meet">
      {barres.map((h, i) => (
        <rect key={i} x={i * 20 + 4} y={70 - h / 2} width="8" height={h} rx="4" />
      ))}
    </svg>
  );
}

/** Portée musicale dorée qui ondule en fond du grand bandeau (cinq lignes, comme une partition). */
function Portee() {
  const lignes = [0, 1, 2, 3, 4];
  return (
    <svg className="portee" viewBox="0 0 1440 260" aria-hidden preserveAspectRatio="none">
      {lignes.map((n) => (
        <path key={n} d={`M0 ${120 + n * 14} C 260 ${40 + n * 14}, 520 ${200 + n * 14}, 760 ${120 + n * 14} S 1200 ${50 + n * 14}, 1440 ${130 + n * 14}`} />
      ))}
    </svg>
  );
}

/** Petit égaliseur animé (la musique joue). */
function Egaliseur() {
  return <span className="egaliseur" aria-hidden><i /><i /><i /><i /></span>;
}

/** Les rendez-vous de la semaine (dans le bandeau sur ordinateur, sous les rubriques sur téléphone). */
function Semaine({ semaine, className }: { semaine: { jour: string; seances: ElementSite[] }[]; className: string }) {
  return (
    <aside className={className} aria-label="Nos rendez-vous de la semaine">
      <div className="hs-tete">
        <span className="med"><Calendar className="i" aria-hidden /></span>
        <div><small>Chaque semaine</small><b>Nos rendez-vous</b></div>
      </div>
      <ul>
        {semaine.map(({ jour, seances }) => (
          <li key={jour}>
            <span className="hs-jour">{jour}</span>
            <span className="hs-detail">
              {seances.map((s) => (
                <span key={s.id}><time>{s.sousTitre}</time> {s.texte}</span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <Link className="hs-lien" href="/programme">Tout le programme<ArrowRight className="i" aria-hidden /></Link>
    </aside>
  );
}

export async function AccueilSite() {
  const [r, actualites, chorales, commissions, soirees, programme] = await Promise.all([
    lireReglages(), lireElements("actualite"), lireElements("chorale"), lireElements("commission"), lireElements("soiree"), lireElements("programme"),
  ]);
  const chaine = await lireChaine(r.youtube_chaine, r.youtube_id).catch(() => null);
  const video = chaine?.direct ?? chaine?.videos[0]?.id ?? null;
  const titreVideo = chaine?.videos.find((x) => x.id === video)?.titre ?? (chaine?.direct ? "En direct" : null);
  const c = contact(r);
  const prochaine = aVenir(soirees).at(0);
  const paroisses = new Set(chorales.map((ch) => ch.sousTitre).filter((l) => l?.startsWith("Paroisse"))).size;
  const semaine = [...new Set(programme.map((l) => l.titre))].map((jour) => ({ jour, seances: programme.filter((l) => l.titre === jour) }));
  return (
    <CadreSite>
      <main className="accueil">
        <Apparition />
        <section className="hero cadre">
          <span className="lumiere" aria-hidden />
          <Portee />
          <Ondes />
          <div className="col large hero-grille">
            <div className="hero-texte">
              <p className="surtitre"><Egaliseur />PGM · Antenne de Muanda · EBNM KCC</p>
              <p className="salut">Paix à vous.</p>
              <h1>{r.accueil_titre}</h1>
              <p className="chapo">{r.accueil_texte}</p>
              <div className="hero-actions">
                <Link className="btn btn-or" href="/direct"><Play className="i" aria-hidden />Regarder PGM Muanda TV</Link>
                <Link className="btn btn-ligne" href="/nous-rejoindre"><UserPlus className="i" aria-hidden />Rejoindre une chorale</Link>
              </div>
            </div>
            <div className="hero-cote sur-pc">
              <div className="embleme" aria-hidden>
                <span className="anneau-tournant" />
                <img src="/logo-pgm.png" alt="" />
              </div>
              {semaine.length > 0 && <Semaine semaine={semaine} className="hero-semaine" />}
            </div>
          </div>
          <svg className="vague" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden>
            <path d="M0 34 C 240 64, 480 4, 720 26 S 1200 58, 1440 22 L1440 60 L0 60 Z" />
          </svg>
        </section>

        <div className="chiffres-band cadre" data-apparait>
          <div className="col large">
            <div className="chiffres">
              <div><span className="med"><Building2 className="i" aria-hidden /></span><b>{paroisses}</b><span>paroisses</span></div>
              <div><span className="med"><Music className="i" aria-hidden /></span><b>{chorales.length * 3}</b><span>chorales</span></div>
              <div><span className="med"><Landmark className="i" aria-hidden /></span><b>{commissions.length}</b><span>commissions</span></div>
              <div><span className="med"><Medal className="i" aria-hidden /></span><b>2009</b><span>création de la PGM</span></div>
            </div>
          </div>
        </div>

        <section className="section cadre">
          <div className="col large">
            <div data-apparait><TitreSection etiquette="Découvrir" titre="Que voulez-vous faire ?" /></div>
            <nav className="decouvrir" aria-label="Rubriques principales">
              {PRINCIPALES.map((href) => RUBRIQUES.find((x) => x.href === href)!).map(({ href, nom, Icone }, i) => (
                <Link key={href} className="d-carte" href={href} data-apparait style={{ "--i": i } as React.CSSProperties}>
                  <Icone className="i filigrane" aria-hidden />
                  <span className="rond"><Icone className="i" aria-hidden /></span>
                  <span className="d-txt"><b>{nom}</b><small>{DESCRIPTIONS[href]}</small></span>
                  <ArrowRight className="i fl" aria-hidden />
                </Link>
              ))}
            </nav>
            <details className="autres-rubriques">
              <summary><Menu className="i" aria-hidden />Toutes les rubriques</summary>
              <nav aria-label="Autres rubriques">
                {RUBRIQUES.filter((x) => !PRINCIPALES.includes(x.href) && x.href !== "/connexion").map(({ href, nom, Icone }) => (
                  <Link key={href} href={href}><Icone className="i" aria-hidden />{nom}<ArrowRight className="i fl" aria-hidden /></Link>
                ))}
              </nav>
            </details>
          </div>
        </section>

        {semaine.length > 0 && (
          <section className="section cadre sur-tel">
            <div className="col large"><Semaine semaine={semaine} className="hero-semaine" /></div>
          </section>
        )}

        <section className="section cadre">
          <div className="col large">
            <div className="tv" data-apparait>
              <div className="tv-txt">
                <span className="tv-marque"><TvMinimalPlay className="i" aria-hidden />PGM Muanda TV</span>
                <h2>Nos cultes et nos louanges, en vidéo</h2>
                <p>Regardez les directs et les rediffusions de la PGM Antenne de Muanda, sans quitter le site.</p>
                <div className="tv-actions">
                  <Link className="btn btn-or" href="/direct"><Play className="i" aria-hidden />Regarder</Link>
                  {chaine?.lienAbonnement && (
                    <a className="btn btn-ligne" href={chaine.lienAbonnement} target="_blank" rel="noopener noreferrer"><BellRing className="i" aria-hidden />S&apos;abonner</a>
                  )}
                </div>
              </div>
              <Link className="tv-ecran" href={video ? `/direct?v=${video}` : "/direct"} aria-label="Ouvrir PGM Muanda TV">
                {video ? <img src={imageVideo(video)} alt="" loading="lazy" /> : <img className="tv-logo" src="/logo-pgm.png" alt="" />}
                {video && <span className="tv-play"><Play className="i" aria-hidden /></span>}
                {chaine?.direct
                  ? <span className="badge-direct"><span className="point" />En direct</span>
                  : titreVideo && <span className="tv-titre">{titreVideo}</span>}
              </Link>
            </div>
          </div>
        </section>

        {(actualites[0] || prochaine) && (
          <section className="section cadre">
            <div className="col large">
              <div data-apparait><TitreSection etiquette="À la une" titre="Les nouvelles de l'antenne" lien={{ href: "/actualites", nom: "Toutes les actualités" }} /></div>
              <div className={prochaine && actualites[0] ? "une-grille" : "une-seule"} data-apparait>
                {actualites[0] && <CarteArticle a={actualites[0]} />}
                {prochaine && (
                  <div className="une-soiree">
                    <span className="etiquette">Prochaine soirée musicale</span>
                    <CarteSoiree s={prochaine} />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="section cadre">
          <div className="col large apropos">
            <div className="apropos-txt" data-apparait>
              <TitreSection etiquette="Qui sommes-nous" titre="Une seule famille de chantres" />
              <p>
                La Présidence générale de la musique (PGM) organise la musique de l&apos;Église Bon Nouveau
                Message (KCC) : les chorales, la formation des choristes, les répétitions et les productions
                lors des cultes. L&apos;Antenne de Muanda en est la représentation locale.
              </p>
              <Link className="btn btn-marine" href="/la-pgm"><BookOpen className="i" aria-hidden />Découvrir la PGM</Link>
            </div>
            <div className="apropos-valeurs">
              <div className="valeur" data-apparait style={{ "--i": 0 } as React.CSSProperties}><span className="ic"><Music className="i" aria-hidden /></span><div><h3>La louange</h3><p>Chanter pour Dieu au culte du dimanche et aux activités de l&apos;antenne.</p></div></div>
              <div className="valeur" data-apparait style={{ "--i": 1 } as React.CSSProperties}><span className="ic"><GraduationCap className="i" aria-hidden /></span><div><h3>La formation</h3><p>Solfège, voix et répertoire, du chantre débutant au chef de chœur.</p></div></div>
              <div className="valeur" data-apparait style={{ "--i": 2 } as React.CSSProperties}><span className="ic"><HeartHandshake className="i" aria-hidden /></span><div><h3>La fraternité</h3><p>S&apos;entraider entre choristes, dans la discipline et le respect.</p></div></div>
            </div>
          </div>
        </section>

        <section className="section cadre">
          <div className="col large" data-apparait><EspaceMembres /></div>
        </section>

        <section className="section cadre">
          <div className="col large">
            <div className="contact-band" data-apparait>
              <div>
                <span className="etiquette">Contact</span>
                <h2>Une question ? Écrivez-nous.</h2>
                <p>Nous répondons sur WhatsApp et par téléphone : {c.affiche}</p>
              </div>
              <div className="cb-actions">
                <a className="btn btn-vert" href={c.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="i" aria-hidden />WhatsApp</a>
                <a className="btn btn-marine" href={`tel:${c.tel}`}><Phone className="i" aria-hidden />Appeler</a>
              </div>
            </div>
          </div>
        </section>
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

export async function PageChorales() {
  const chorales = await lireElements("chorale");
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Music} titre="Nos chorales"
          texte="Chaque groupe a une chorale de femmes, une d'hommes et une chorale junior." />
        <Bloc>
          <div className="chorales">
            {chorales.map((c) => (
              <div key={c.id} className="chorale">
                <span className="ini">{c.titre[0]}</span>
                <div>
                  <h3>{c.titre}</h3>
                  {c.sousTitre && <p className="lieu"><MapPin className="i" aria-hidden />{c.sousTitre}</p>}
                  {c.texte && <p className="note">{c.texte}</p>}
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

export async function PageProgramme() {
  const lignes = await lireElements("programme");
  const jours = [...new Set(lignes.map((l) => l.titre))].map((jour) => ({ jour, seances: lignes.filter((l) => l.titre === jour) }));
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Calendar} titre="Programme" texte="Horaires habituels de la semaine, selon le Règlement intérieur." />
        <Bloc>
          <div className="semaine">
            {jours.map(({ jour, seances }) => (
              <div key={jour} className="jour">
                <div className="j">{/^dimanche/i.test(jour) ? <Music className="i" aria-hidden /> : <Mic className="i" aria-hidden />}<b>{jour}</b></div>
                <ul>
                  {seances.map((s) => (
                    <li key={s.id}>
                      {/\d/.test(s.sousTitre ?? "") ? <Clock className="i" aria-hidden /> : <Music className="i" aria-hidden />}
                      <div><time>{s.sousTitre}</time><span>{s.texte}</span></div>
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

export async function PageActualites() {
  const actualites = await lireElements("actualite");
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Newspaper} titre="Actualités" texte="Les nouvelles de la PGM Antenne de Muanda." />
        <Bloc>
          {actualites.length === 0 ? <p className="note">Aucune actualité pour le moment.</p>
            : actualites.map((a) => <CarteArticle key={a.id} a={a} />)}
          <Suite href="/commissions" nom="Nos commissions" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export async function PageCommissions() {
  const commissions = await lireElements("commission");
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Landmark} titre="Nos commissions" texte="Les commissions qui font fonctionner l'antenne." />
        <Bloc>
          <ul className="commissions">
            {commissions.map((c) => {
              const Icone = iconeCommission(c.titre);
              return (
                <li key={c.id}>
                  <span className="ic"><Icone className="i" aria-hidden /></span>
                  <div><h3>{c.titre}</h3>{c.texte && <span>{c.texte}</span>}</div>
                </li>
              );
            })}
          </ul>
          <Suite href="/nous-rejoindre" nom="Nous rejoindre" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export async function PageRejoindre() {
  const c = contact(await lireReglages());
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
          {c.whatsapp && (
            <a className="btn btn-vert" href={c.whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="i" aria-hidden />Poser une question sur WhatsApp
            </a>
          )}
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

export async function PageQuestions() {
  const questions = await lireElements("question");
  return (
    <CadreSite>
      <main>
        <EnTete Icone={CircleHelp} titre="Questions fréquentes" texte="Touchez une question pour voir la réponse." />
        <Bloc>
          <div className="faq">
            {questions.map((q) => (
              <details key={q.id}>
                <summary>{q.titre}</summary>
                {paragraphes(q.texte).map((p) => <p key={p}>{p}</p>)}
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

export async function PageContact() {
  const c = contact(await lireReglages());
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Phone} titre="Contact" texte="Une question ? Écrivez-nous ou appelez-nous." />
        <Bloc>
          <div className="contact-actions">
            <a className="c-btn" href={c.whatsapp} target="_blank" rel="noopener noreferrer">
              <span className="rond wa"><MessageCircle className="i" aria-hidden /></span>WhatsApp<small>Écrire un message</small>
            </a>
            <a className="c-btn" href={`tel:${c.tel}`}>
              <span className="rond tel"><Phone className="i" aria-hidden /></span>Appeler<small>{c.affiche}</small>
            </a>
          </div>
          <div className="carte lignes">
            <div className="ligne-c"><span className="ic"><Phone className="i" aria-hidden /></span><div><small>Téléphone et WhatsApp</small>{c.affiche}</div></div>
            <div className="ligne-c"><span className="ic"><MapPin className="i" aria-hidden /></span><div><small>Lieu</small>Muanda, Kongo-Central, RD Congo</div></div>
            <div className="ligne-c"><span className="ic"><Users className="i" aria-hidden /></span><div><small>Questions sur une chorale</small>Adressez-vous au responsable de la chorale de votre paroisse.</div></div>
          </div>
          <EspaceMembres />
        </Bloc>
      </main>
    </CadreSite>
  );
}

const miniature = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

export async function PageDirect({ v }: { v?: string }) {
  const r = await lireReglages();
  const chaine = await lireChaine(r.youtube_chaine, r.youtube_id);
  const choisie = (v && (chaine.videos.some((x) => x.id === v) || v === chaine.direct) ? v : null)
    ?? chaine.direct ?? chaine.videos[0]?.id ?? null;
  const enDirect = choisie !== null && choisie === chaine.direct;
  const titre = chaine.videos.find((x) => x.id === choisie)?.titre ?? (enDirect ? "En direct" : "PGM Muanda TV");
  const lecteur = choisie || chaine.listeVideos;
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Radio} titre="Direct" texte="PGM Muanda TV : les cultes, louanges et productions de la PGM Antenne de Muanda, sans quitter le site." />
        {!enDirect && <GuetteurDirect />}
        <Bloc>
          <div className="chaine carte">
            <img src="/logo-pgm.png" alt="" />
            <div>
              <b>PGM Muanda</b>
              <span>@{r.youtube_chaine.replace(/^@/, "")}{chaine.abonnes && <> · {chaine.abonnes} abonnés</>}</span>
            </div>
            <a className="btn-abonner" href={chaine.lienAbonnement} target="_blank" rel="noopener noreferrer">
              <BellRing className="i" aria-hidden />S&apos;abonner
            </a>
          </div>
          <p className="abonnez">Abonnez-vous à la chaîne : vous serez prévenu à chaque nouvelle vidéo et à chaque direct.</p>

          {lecteur ? (
            <div className="ecran" id="lecteur">
              <div className="ecran-bandeau">
                <span className="tv"><Radio className="i" aria-hidden />PGM Muanda TV</span>
                {enDirect
                  ? <span className="badge-direct"><span className="point" />En direct</span>
                  : <span className="badge-video"><Play className="i" aria-hidden />Rediffusion</span>}
              </div>
              <LecteurVideo id={choisie ?? undefined} liste={chaine.listeVideos} titre={titre} auto={!v} />
              <div className="ecran-titre">
                <b>{titre}</b>
                {!enDirect && <small>Les vidéos s&apos;enchaînent. Quand un direct commence, il s&apos;affiche ici automatiquement.</small>}
              </div>
              {choisie && <Partage texte={`${enDirect ? "En direct maintenant" : "À regarder"} sur PGM Muanda TV : ${titre}`} chemin={`/direct?v=${choisie}`} image={imageVideo(choisie)} />}
            </div>
          ) : (
            <div className="carte vide-direct">
              <span className="ic"><TvMinimalPlay className="i" aria-hidden /></span>
              <p>Les vidéos de la chaîne s&apos;afficheront ici.</p>
            </div>
          )}

          {chaine.videos.length > 0 && (
            <>
              <div className="titre"><span className="etiquette">Toutes nos vidéos</span></div>
              <ul className="videos">
                {chaine.videos.map((x) => (
                  <li key={x.id}>
                    <Link href={`/direct?v=${x.id}#lecteur`} className={x.id === choisie ? "actif" : undefined} scroll={false}>
                      <span className="vignette">
                        <img src={miniature(x.id)} alt="" loading="lazy" width={320} height={180} />
                        {x.id === chaine.direct ? <span className="badge-direct"><span className="point" />Direct</span>
                          : <span className="lire-video"><Play className="i" aria-hidden /></span>}
                      </span>
                      <span className="v-txt">
                        <b>{x.titre}</b>
                        {x.date && <small>{dateLongue(x.date.slice(0, 10))}</small>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Suite href="/ecouter" nom="Écouter les répétitions" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

/** Image de partage d'une vidéo : sa miniature. */
export const imageVideo = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export async function PageEcouter({ chorale }: { chorale?: string }) {
  const audios = await lireElements("audio");
  const chorales = [...new Set(audios.map((a) => a.sousTitre).filter((c): c is string => !!c))];
  const liste = chorale ? audios.filter((a) => a.sousTitre === chorale) : audios;
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Headphones} titre="Écouter" texte="Les audios des répétitions des chorales, pour apprendre et réviser les chants." />
        <Bloc>
          {chorales.length > 1 && (
            <nav className="filtres" aria-label="Choisir une chorale">
              <Link href="/ecouter" className={!chorale ? "actif" : undefined}>Toutes</Link>
              {chorales.map((c) => (
                <Link key={c} href={`/ecouter?chorale=${encodeURIComponent(c)}`} className={c === chorale ? "actif" : undefined}>{c}</Link>
              ))}
            </nav>
          )}
          {liste.length === 0 ? (
            <div className="carte vide-direct">
              <span className="ic"><Headphones className="i" aria-hidden /></span>
              <p>Aucun audio pour le moment. Les audios des répétitions seront ajoutés ici par l&apos;administration.</p>
            </div>
          ) : (
            <ul className="audios">
              {liste.map((a) => (
                <li key={a.id} className="carte">
                  <div className="a-tete">
                    <span className="ic"><Music className="i" aria-hidden /></span>
                    <div>
                      <b>{a.titre}</b>
                      <small>{[a.sousTitre, a.date && dateLongue(a.date)].filter(Boolean).join(" · ")}</small>
                    </div>
                  </div>
                  {a.texte && <p>{a.texte}</p>}
                  {a.fichier && <audio controls preload="none" src={urlFichier(a.fichier)} />}
                </li>
              ))}
            </ul>
          )}
          <p className="note">Un audio consomme des données internet : écoutez de préférence avec le Wi-Fi.</p>
          <Suite href="/programme" nom="Programme" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

/* Publications avec leur propre page (et donc leur image de partage). */
export const PUBLICATIONS = {
  actualite: { liste: "/actualites", nom: "Actualités", etiquette: "Actualité" },
  soiree: { liste: "/soirees", nom: "Soirées musicales", etiquette: "Soirée musicale" },
  social: { liste: "/cas-sociaux", nom: "Cas sociaux", etiquette: "Cas social" },
  pionnier: { liste: "/pionniers", nom: "Les pionniers", etiquette: "Nos pionniers" },
} as const;
export type Publication = keyof typeof PUBLICATIONS;
export const lienPublication = (e: ElementSite) => `${PUBLICATIONS[e.rubrique as Publication].liste}/${e.id}`;

/** Texte d'annonce utilisé pour le partage. */
export function annonce(e: ElementSite) {
  if (e.rubrique === "soiree") return [`Soirée musicale de la PGM Antenne de Muanda : ${e.titre}`, e.date && `le ${dateLongue(e.date)}`, e.sousTitre].filter(Boolean).join(", ") + ". Venez nombreux !";
  if (e.rubrique === "pionnier") return `Nos pionniers : ${e.titre}`;
  return e.titre;
}

/* Les adresses web écrites dans un texte (www.… ou https://…) deviennent des liens. */
export function avecLiens(texte: string) {
  return texte.split(/((?:https?:\/\/|www\.)[^\s]+[^\s.,;:!?)])/g).map((morceau, i) =>
    i % 2 === 1
      ? <a key={i} href={morceau.startsWith("http") ? morceau : `https://${morceau}`} target="_blank" rel="noopener noreferrer">{morceau}</a>
      : morceau);
}

/* Le texte d'un article, avec ses autres photos placées au milieu. */
function paragraphesAvecPhotos(e: ElementSite) {
  const ps = paragraphes(e.texte);
  const milieu = Math.ceil(ps.length / 2);
  const photos = (e.photos ?? []).map((src) => <img key={src} className="photo-pub" src={urlFichier(src)} alt="" loading="lazy" />);
  return ps.flatMap((p, i) => [<p key={i}>{avecLiens(p)}</p>, ...(i === milieu - 1 ? photos : [])]);
}

export async function PagePublication({ id, rubrique }: { id: string; rubrique: Publication }) {
  const e = await lireElement(id);
  if (!e || e.rubrique !== rubrique || !e.publie) return null;
  const pub = PUBLICATIONS[rubrique];
  return (
    <CadreSite>
      <main className="vue-article cadre">
        <div className="col article">
          <Link className="retour" href={pub.liste}><ArrowLeft className="i" aria-hidden />{pub.nom}</Link>
          <span className="etiquette">{pub.etiquette}</span>
          <h1>{e.titre}</h1>
          {e.date && <span className="meta"><Calendar className="i" aria-hidden />{rubrique === "soiree" ? "" : "Muanda, le "}{dateLongue(e.date)}</span>}
          {e.sousTitre && (rubrique === "soiree"
            ? <span className="meta"><MapPin className="i" aria-hidden />{e.sousTitre}</span>
            : <p className="chapo-article">{e.sousTitre}</p>)}
          {e.image && <img className="photo-pub" src={urlFichier(e.image)} alt="" />}
          {paragraphesAvecPhotos(e)}
          <Partage texte={annonce(e)} chemin={lienPublication(e)} image={e.image ? urlFichier(e.image) : null} />
          {rubrique === "actualite" && (
            <>
              <div className="signature"><b>La Présidence de la PGM Antenne de Muanda</b>EBNM KCC · Muanda</div>
              <Link className="btn btn-or" href="/connexion"><LogIn className="i" aria-hidden />Se connecter à mon espace</Link>
            </>
          )}
        </div>
      </main>
    </CadreSite>
  );
}

/* Soirées musicales : les dates à venir d'abord (la plus proche en premier), puis les passées. */
const aujourdhui = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10); // heure de Muanda
const aVenir = (l: ElementSite[]) => l.filter((s) => s.date && s.date >= aujourdhui()).reverse();
const passees = (l: ElementSite[]) => l.filter((s) => !s.date || s.date < aujourdhui());

function CarteSoiree({ s, passee = false }: { s: ElementSite; passee?: boolean }) {
  const jour = s.date ? new Date(`${s.date}T12:00:00Z`) : null;
  return (
    <article className={`soiree-carte carte${passee ? " passee" : ""}`}>
      {s.image && <Link href={lienPublication(s)}><img className="affiche" src={urlFichier(s.image)} alt="" loading="lazy" /></Link>}
      <div className="soiree">
        {jour && (
          <div className="calendrier" aria-hidden>
            <small>{jour.toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" })}</small>
            <b>{jour.getUTCDate()}</b>
            <small>{jour.toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" })}</small>
          </div>
        )}
        <div className="s-txt">
          <Link href={lienPublication(s)}><b>{s.titre}</b></Link>
          {s.date && <span className="meta"><Calendar className="i" aria-hidden />{dateLongue(s.date)}</span>}
          {s.sousTitre && <span className="meta"><MapPin className="i" aria-hidden />{s.sousTitre}</span>}
          {s.texte && <p>{s.texte}</p>}
        </div>
      </div>
      {!passee && <Partage compact texte={annonce(s)} chemin={lienPublication(s)} image={s.image ? urlFichier(s.image) : null} />}
    </article>
  );
}

export async function PageSoirees() {
  const soirees = await lireElements("soiree");
  const futur = aVenir(soirees);
  const passe = passees(soirees);
  return (
    <CadreSite>
      <main>
        <EnTete Icone={CalendarHeart} titre="Soirées musicales" texte="Les dates des soirées musicales de la PGM. Partagez-les autour de vous." />
        <Bloc>
          {futur.length === 0
            ? <div className="carte vide-direct"><span className="ic"><CalendarHeart className="i" aria-hidden /></span><p>Aucune soirée musicale programmée pour le moment. Revenez bientôt !</p></div>
            : futur.map((s) => <CarteSoiree key={s.id} s={s} />)}
          {passe.length > 0 && (
            <>
              <div className="titre"><span className="etiquette">Soirées passées</span></div>
              {passe.map((s) => <CarteSoiree key={s.id} s={s} passee />)}
            </>
          )}
          <Suite href="/direct" nom="Revoir en vidéo" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export async function PageCasSociaux() {
  const [cas, r] = await Promise.all([lireElements("social"), lireReglages()]);
  const c = contact(r);
  return (
    <CadreSite>
      <main>
        <EnTete Icone={HandHeart} titre="Cas sociaux" texte="Joies et peines de la famille PGM : soutenons-nous les uns les autres." />
        <Bloc>
          {cas.length === 0
            ? <div className="carte vide-direct"><span className="ic"><HandHeart className="i" aria-hidden /></span><p>Aucun cas social annoncé pour le moment.</p></div>
            : cas.map((x) => (
              <article key={x.id} className="carte cas">
                {x.image && <Link href={lienPublication(x)}><img className="affiche" src={urlFichier(x.image)} alt="" loading="lazy" /></Link>}
                <div className="a-tete">
                  <span className="ic"><HeartHandshake className="i" aria-hidden /></span>
                  <div>
                    <Link href={lienPublication(x)}><b>{x.titre}</b></Link>
                    <small>{[x.sousTitre, x.date && dateLongue(x.date)].filter(Boolean).join(" · ")}</small>
                  </div>
                </div>
                {paragraphes(x.texte).map((p, i) => <p key={i}>{p}</p>)}
                <Partage compact texte={annonce(x)} chemin={lienPublication(x)} image={x.image ? urlFichier(x.image) : null} />
              </article>
            ))}
          <div className="carte lignes">
            <div className="ligne-c"><span className="ic"><HeartPulse className="i" aria-hidden /></span><div><small>Pour aider ou signaler un cas</small>Contactez la commission Santé &amp; Assistance, ou appelez le {c.affiche}.</div></div>
          </div>
          <Suite href="/pionniers" nom="Les pionniers" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export async function PagePionniers() {
  const pionniers = await lireElements("pionnier");
  return (
    <CadreSite>
      <main>
        <EnTete Icone={Medal} titre="Les pionniers" texte="Ceux qui ont posé les fondations de la PGM à Muanda. Nous honorons leur mémoire et leur travail." />
        <Bloc>
          {pionniers.length === 0
            ? <div className="carte vide-direct"><span className="ic"><Medal className="i" aria-hidden /></span><p>L&apos;histoire de nos pionniers sera bientôt racontée ici.</p></div>
            : (
              <ul className="pionniers">
                {pionniers.map((x) => (
                  <li key={x.id} className="carte">
                    <div className="p-tete">
                      {x.image
                        ? <img className="portrait" src={urlFichier(x.image)} alt="" loading="lazy" />
                        : <span className="ini" aria-hidden>{x.titre.split(/\s+/).map((m) => m[0]).slice(0, 2).join("").toUpperCase()}</span>}
                      <div>
                        <Link href={lienPublication(x)}><b>{x.titre}</b></Link>
                        {x.sousTitre && <small>{x.sousTitre}</small>}
                      </div>
                    </div>
                    {paragraphes(x.texte).map((p, i) => <p key={i}>{p}</p>)}
                    <Partage compact texte={annonce(x)} chemin={lienPublication(x)} image={x.image ? urlFichier(x.image) : null} />
                  </li>
                ))}
              </ul>
            )}
          <Suite href="/la-pgm" nom="La PGM" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

export async function PageCauserie() {
  const [r, active] = await Promise.all([lireReglages(), siteEnBase()]);
  return (
    <CadreSite>
      <main>
        <EnTete Icone={MessagesSquare} titre="Causerie" texte="Discutez en direct avec la famille PGM. Sans compte et sans numéro : un prénom suffit." />
        <Bloc>
          <Causerie ouverte={r.causerie_ouverte === "oui"} active={active} />
          <ul className="regles-causerie">
            <li><ShieldCheck className="i" aria-hidden />Restez respectueux : les messages déplacés sont retirés par l&apos;administration.</li>
            <li><Lock className="i" aria-hidden />N&apos;écrivez pas de numéro de téléphone ni d&apos;information privée : tout le monde lit la causerie.</li>
          </ul>
          <Suite href="/soirees" nom="Soirées musicales" />
        </Bloc>
      </main>
    </CadreSite>
  );
}

const CONFIDENTIALITE = [
  {
    titre: "Ce que nous recevons",
    points: [
      "Visiteurs du site : aucun compte n'est demandé et aucune publicité n'est affichée.",
      "Causerie : le nom que vous choisissez et votre message, visibles par tous. Une clé anonyme, gardée sur votre téléphone, sert seulement à limiter les abus.",
      "Membres : nom, postnom, prénom, photo, sexe, téléphone, paroisse, chorale, voix, fonction, présences et cotisations, saisis par les responsables de la PGM.",
    ],
  },
  {
    titre: "À quoi cela sert",
    points: [
      "Faire vivre la PGM : cartes de membre, présences, cotisations, annonces et formations.",
      "Vérifier une carte de membre quand on scanne son code QR.",
      "Rien n'est vendu ni donné à une entreprise ou à un annonceur.",
    ],
  },
  {
    titre: "Qui peut voir vos informations",
    points: [
      "Un membre voit ses propres informations.",
      "Les responsables voient seulement ce dont ils ont besoin pour leur service (leur chorale, leur paroisse ou les finances quand l'administration le permet).",
      "Les données sont gardées chez Supabase et le site chez Vercel, avec une connexion chiffrée (https). Une copie de sauvegarde chiffrée est faite chaque nuit.",
    ],
  },
  {
    titre: "Vos droits",
    points: [
      "Vous pouvez demander à voir, corriger ou supprimer vos informations.",
      "Un message de la Causerie peut être retiré sur simple demande.",
      "Pour toute demande, contactez la PGM Antenne de Muanda au +243 825 717 444 (WhatsApp ou appel).",
    ],
  },
];

export function PageConfidentialite() {
  return (
    <CadreSite>
      <main>
        <EnTete Icone={ShieldCheck} titre="Confidentialité"
          texte="Comment la PGM Antenne de Muanda protège vos informations, sur le site et dans l'application." />
        <Bloc>
          <div className="faq regles">
            {CONFIDENTIALITE.map(({ titre, points }) => (
              <details key={titre} open>
                <summary><span>{titre}</span></summary>
                <ul className="puces">{points.map((p) => <li key={p}>{p}</li>)}</ul>
              </details>
            ))}
          </div>
          <p className="note">Dernière mise à jour : 31 octobre 2026.</p>
        </Bloc>
      </main>
    </CadreSite>
  );
}
