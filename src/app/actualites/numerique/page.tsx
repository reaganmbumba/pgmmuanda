import Link from "next/link";
import { ArrowLeft, Calendar, LogIn } from "lucide-react";
import { CadreSite } from "@/components/site/CadreSite";

export const metadata = {
  title: "La PGM Antenne de Muanda passe au numérique",
  description: "Communiqué officiel : lancement de l'application PGM MUANDA DIGITAL.",
};

export default function ArticleNumerique() {
  return (
    <CadreSite>
      <main className="vue-article cadre">
        <div className="col article">
          <Link className="retour" href="/actualites"><ArrowLeft className="i" aria-hidden />Retour</Link>
          <span className="etiquette">Communiqué officiel</span>
          <h1>La PGM Antenne de Muanda passe au numérique</h1>
          <span className="meta"><Calendar className="i" aria-hidden />Muanda, le 30 octobre 2026</span>
          <p className="salut" style={{ color: "var(--or)" }}>Paix à toutes et à tous.</p>
          <p>
            La Présidence générale de la musique, Antenne de Muanda (EBNM KCC), a le plaisir d&apos;annoncer
            la numérisation de son système d&apos;organisation. Les fiches des membres, les cartes, le programme
            des activités, les présences, les annonces et les chants sont maintenant réunis dans une seule
            application : <strong>PGM MUANDA DIGITAL</strong>.
          </p>
          <p>
            Jusqu&apos;ici, beaucoup d&apos;informations circulaient sur papier ou dans plusieurs groupes de
            messages. Il était difficile de savoir qui était présent, quelle carte était valable ou quel chant
            préparer pour dimanche. L&apos;application met tout cela au même endroit, de manière claire et simple.
          </p>
          <h2>Ce que chaque choriste peut faire</h2>
          <ul>
            <li>Voir sa carte de membre avec son code QR</li>
            <li>Suivre le programme des répétitions, cultes et activités</li>
            <li>Voir ses présences, ses absences et ses cotisations</li>
            <li>Lire les annonces et les notifications</li>
            <li>Préparer les chants, avec paroles et partitions</li>
            <li>Consulter les documents, les formations et les réunions</li>
          </ul>
          <h2>Une carte de membre avec code QR</h2>
          <p>
            Chaque choriste dispose d&apos;une carte de membre numérique, que les responsables peuvent aussi
            imprimer. En scannant son code QR avec un téléphone, on voit tout de suite si la carte est valable
            et à qui elle appartient. Lors des activités, les responsables scannent aussi les cartes pour noter
            les présences rapidement.
          </p>
          <h2>Un outil pour les responsables</h2>
          <p>
            Les responsables de paroisse, de chorale et de commission, ainsi que les membres du Conseil,
            tiennent la liste des membres, le registre de présence, le programme, les annonces, les chants, les
            réunions et les cotisations. Chacun ne voit que ce qui concerne sa fonction, et les données sont
            sauvegardées chaque nuit.
          </p>
          <blockquote>
            Un seul endroit pour le programme, les présences, les chants et les annonces de toute l&apos;antenne.
          </blockquote>
          <h2>Un pas de plus au service de la louange</h2>
          <p>
            Cette numérisation ne remplace ni la prière, ni les répétitions, ni la fraternité entre choristes.
            Elle doit nous aider à mieux nous organiser et à consacrer davantage de temps à l&apos;essentiel :
            servir Dieu par le chant.
          </p>
          <p>Que Dieu bénisse la PGM Antenne de Muanda et tous ses choristes.</p>
          <div className="signature"><b>La Présidence de la PGM Antenne de Muanda</b>EBNM KCC · Muanda</div>
          <Link className="btn btn-or" href="/connexion"><LogIn className="i" aria-hidden />Se connecter à mon espace</Link>
        </div>
      </main>
    </CadreSite>
  );
}
