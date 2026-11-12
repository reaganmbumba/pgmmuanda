import { JeuSolfa } from "@/components/solfa/JeuSolfa";

export const metadata = { title: "Jeu du sol-fa" };

/** Le même jeu que dans l'espace choriste, pour le staff (essayer, montrer en répétition). */
export default function PageJeuSolfaStaff() {
  return (
    <div className="mx-auto max-w-2xl">
      <JeuSolfa />
    </div>
  );
}
