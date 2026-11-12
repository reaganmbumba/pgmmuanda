import { JeuSolfa } from "@/components/solfa/JeuSolfa";

export const metadata = { title: "Jeu du sol-fa" };

/** Espace de jeu : apprendre le tonic sol-fa en jouant (niveaux, écoute, points). */
export default function PageJeuSolfa() {
  return <JeuSolfa />;
}
