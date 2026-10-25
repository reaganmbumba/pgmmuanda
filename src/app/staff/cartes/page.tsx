import { Download, Printer, RefreshCcw, ShieldX } from "lucide-react";
import { CarteMembre } from "@/components/carte/CarteMembre";
import { Bouton } from "@/components/ui/Bouton";
import { EnTete } from "@/components/ui/Carte";
import { membres } from "@/lib/demo-data";

export const metadata = { title: "Cartes et QR codes" };

export default function PageCartes() {
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
