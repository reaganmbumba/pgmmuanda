/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowRight, BookOpen, Calendar, Church, CircleCheck, Clock, FilePen, GraduationCap,
  HeartHandshake, HeartPulse, Landmark, ListMusic, LogIn, Lock, Mail, MapPin, Megaphone,
  MessageCircle, Mic, Music, Network, Newspaper, PenLine, Phone, QrCode, ShieldCheck, Shirt,
  Truck, UserPlus, Users, Wallet, type LucideIcon,
} from "lucide-react";
import { CadreSite } from "./CadreSite";

/* Contenu public : aucune donnée de membre, seulement l'organisation de l'antenne. */

const CHORALES = [
  { nom: "Vision", lieu: "Paroisse Atlantique" },
  { nom: "Echo", lieu: "Paroisse Pika Pende" },
  { nom: "Alliance", lieu: "Paroisse Itonde" },
  { nom: "CHOPDI", lieu: "Paroisse Kitsiaku" },
  { nom: "Oracle", lieu: "Chorale urbaine, dans toutes les paroisses" },
];

const SEMAINE: { jour: string; Icone: LucideIcon; seances: { heure: string; quoi: string }[] }[] = [
  { jour: "Lundi", Icone: Mic, seances: [
    { heure: "15h30 – 17h30", quoi: "Répétition des femmes" },
    { heure: "17h30 – 19h30", quoi: "Répétition des hommes" },
  ] },
  { jour: "Jeudi", Icone: Mic, seances: [
    { heure: "15h30 – 17h30", quoi: "Répétition des femmes" },
    { heure: "17h30 – 19h30", quoi: "Répétition des hommes" },
  ] },
  { jour: "Dimanche", Icone: Church, seances: [{ heure: "Culte", quoi: "Louange dans chaque paroisse" }] },
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
  { titre: "La demande", texte: "Écrivez au Comité directeur de la chorale de votre paroisse.", Icone: FilePen },
  { titre: "La moralité", texte: "Le comité vérifie votre bonne moralité.", Icone: ShieldCheck },
  { titre: "Le test de voix", texte: "Vous passez un test d'évaluation.", Icone: Mic },
  { titre: "L'engagement", texte: "Vous signez l'acte d'engagement (sauf pour la chorale junior).", Icone: PenLine },
];

const RACCOURCIS: { ancre: string; nom: string; Icone: LucideIcon }[] = [
  { ancre: "chorales", nom: "Chorales", Icone: Music },
  { ancre: "programme", nom: "Programme", Icone: Calendar },
  { ancre: "actualites", nom: "Actualités", Icone: Newspaper },
  { ancre: "commissions", nom: "Commissions", Icone: Landmark },
  { ancre: "rejoindre", nom: "Nous rejoindre", Icone: UserPlus },
  { ancre: "contact", nom: "Contact", Icone: Phone },
];

function Titre({ Icone, etiquette, titre, texte }: { Icone: LucideIcon; etiquette: string; titre: string; texte?: string }) {
  return (
    <div className="titre">
      <div className="tete">
        <span className="pastille"><Icone className="i" aria-hidden /></span>
        <span className="etiquette">{etiquette}</span>
      </div>
      <h2>{titre}</h2>
      {texte && <p>{texte}</p>}
    </div>
  );
}

export function SitePublic() {
  return (
    <CadreSite>
      <main>
        <section className="une cadre" id="accueil">
          <div className="col">
            <p className="salut">Paix à vous.</p>
            <h1>Servir Dieu par le chant, à Muanda</h1>
            <p className="chapo">
              La Présidence générale de la musique rassemble les chorales de l&apos;EBNM KCC.
              L&apos;Antenne de Muanda en est la représentation locale.
            </p>
            <nav className="raccourcis" aria-label="Accès rapide">
              {RACCOURCIS.map(({ ancre, nom, Icone }) => (
                <a key={ancre} className="tuile" href={`#${ancre}`}>
                  <span className="rond"><Icone className="i" aria-hidden /></span>
                  {nom}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <div className="chiffres-band cadre">
          <div className="col">
            <div className="chiffres">
              <div><Church className="i" aria-hidden /><b>4</b><span>paroisses</span></div>
              <div><Music className="i" aria-hidden /><b>15</b><span>chorales</span></div>
              <div><Landmark className="i" aria-hidden /><b>7</b><span>commissions</span></div>
            </div>
          </div>
        </div>

        <section className="bloc cadre" id="qui">
          <div className="col">
            <Titre Icone={BookOpen} etiquette="Qui sommes-nous" titre="Une seule famille de chantres" />
            <p>
              La PGM organise la musique de l&apos;Église : les chorales, la formation des choristes,
              les répétitions et les productions lors des cultes et des grands rassemblements. Elle
              suit son Cadre général et son Règlement intérieur, signés en 2021, approuvés par
              l&apos;Église en 2022 et authentifiés par le Ministère de la Justice en 2024.
            </p>
            <div className="dirigeant">
              <div>
                <small>Président général</small>
                <b>Rév. Apôtre NDANGI MAKWALA Etienne-Oscar</b>
                <p className="note">Siège : Temple paroissial de Masina, Kinshasa</p>
              </div>
            </div>
            <div className="valeurs">
              <div className="valeur"><span className="ic"><Music className="i" aria-hidden /></span><div><h3>La louange</h3><p>Chanter pour Dieu au culte du dimanche et lors des activités de l&apos;Église.</p></div></div>
              <div className="valeur"><span className="ic"><GraduationCap className="i" aria-hidden /></span><div><h3>La formation</h3><p>Apprendre le solfège, les voix et le répertoire, du chantre débutant au chef de chœur.</p></div></div>
              <div className="valeur"><span className="ic"><HeartHandshake className="i" aria-hidden /></span><div><h3>La fraternité</h3><p>S&apos;entraider entre choristes, dans la discipline et le respect de chacun.</p></div></div>
            </div>
          </div>
        </section>

        <section className="bloc cadre" id="chorales">
          <div className="col">
            <Titre Icone={Music} etiquette="Nos chorales" titre="Cinq groupes, quinze chorales"
              texte="Chaque groupe a une chorale de femmes, une d'hommes et une chorale junior." />
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
          </div>
        </section>

        <section className="bloc cadre" id="programme">
          <div className="col">
            <Titre Icone={Calendar} etiquette="Programme" titre="Notre semaine"
              texte="Horaires habituels des répétitions selon le Règlement intérieur." />
            <div className="semaine">
              {SEMAINE.map(({ jour, Icone, seances }) => (
                <div key={jour} className="jour">
                  <div className="j"><Icone className="i" aria-hidden /><b>{jour}</b></div>
                  <ul>
                    {seances.map((s) => (
                      <li key={s.quoi}>
                        {s.heure === "Culte" ? <Music className="i" aria-hidden /> : <Clock className="i" aria-hidden />}
                        <div><time>{s.heure}</time><span>{s.quoi}</span></div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="note">
              Les horaires précis de chaque chorale, les concerts et les déplacements sont publiés
              dans l&apos;espace membres.
            </p>
          </div>
        </section>

        <section className="bloc cadre" id="actualites">
          <div className="col">
            <Titre Icone={Newspaper} etiquette="Actualités" titre="Les nouvelles de l'antenne" />
            <Link className="actu" href="/actualites/numerique">
              <div className="vis">
                <img src="/logo-pgm.png" alt="" />
                <b>La PGM Antenne de Muanda passe au numérique</b>
              </div>
              <div className="txt">
                <span className="meta"><Calendar className="i" aria-hidden />Muanda, le 30 octobre 2026</span>
                <p>
                  Avec PGM MUANDA DIGITAL, chaque choriste et chaque responsable a son espace
                  personnel pour suivre la vie de la PGM depuis son téléphone.
                </p>
                <span className="lire">Lire l&apos;article<ArrowRight className="i" aria-hidden /></span>
              </div>
            </Link>
          </div>
        </section>

        <section className="bloc cadre" id="commissions">
          <div className="col">
            <Titre Icone={Landmark} etiquette="Organisation" titre="Nos commissions"
              texte="Sept commissions font fonctionner l'antenne." />
            <ul className="commissions">
              {COMMISSIONS.map(({ nom, role, Icone }) => (
                <li key={nom}>
                  <span className="ic"><Icone className="i" aria-hidden /></span>
                  <div><h3>{nom}</h3><span>{role}</span></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bloc cadre" id="rejoindre">
          <div className="col">
            <Titre Icone={UserPlus} etiquette="Nous rejoindre" titre="Devenir choriste"
              texte="Les étapes prévues par le Règlement intérieur :" />
            <ol className="etapes">
              {ETAPES.map(({ titre, texte, Icone }, i) => (
                <li key={titre}>
                  <span className="ic"><Icone className="i" aria-hidden /><span className="num">{i + 1}</span></span>
                  <div><h3>{titre}</h3><p>{texte}</p></div>
                </li>
              ))}
            </ol>
            <p className="note">
              Une fois membre, vous participez aux répétitions, vous payez régulièrement vos
              cotisations et vous recevez votre carte de membre avec code QR.
            </p>
          </div>
        </section>

        <section className="bloc cadre" id="espace">
          <div className="col">
            <div className="appli">
              <div className="titre">
                <div className="tete">
                  <span className="pastille" style={{ background: "var(--or-clair)", color: "var(--marine)" }}>
                    <Lock className="i" aria-hidden />
                  </span>
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
              <p className="note" style={{ color: "var(--sur-marine-doux)" }}>
                Pas encore de compte ? Votre responsable de chorale vous envoie votre identifiant par WhatsApp.
              </p>
            </div>
          </div>
        </section>

        <section className="bloc cadre" id="contact">
          <div className="col">
            <Titre Icone={Phone} etiquette="Contact" titre="Nous trouver" />
            {/* Numéros et e-mail à recevoir de la Présidence de l'antenne. */}
            <div className="contact-actions">
              <span className="c-btn"><span className="rond wa"><MessageCircle className="i" aria-hidden /></span>WhatsApp<small>à compléter</small></span>
              <span className="c-btn"><span className="rond tel"><Phone className="i" aria-hidden /></span>Appeler<small>à compléter</small></span>
              <span className="c-btn"><span className="rond mail"><Mail className="i" aria-hidden /></span>E-mail<small>à compléter</small></span>
            </div>
            <div className="carte lignes">
              <div className="ligne-c"><span className="ic"><MapPin className="i" aria-hidden /></span><div><small>Lieu</small>Muanda, Kongo-Central, RD Congo</div></div>
              <div className="ligne-c"><span className="ic"><Users className="i" aria-hidden /></span><div><small>Questions sur une chorale</small>Adressez-vous au responsable de la chorale de votre paroisse.</div></div>
            </div>
          </div>
        </section>
      </main>
    </CadreSite>
  );
}
