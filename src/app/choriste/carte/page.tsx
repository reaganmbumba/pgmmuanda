import { Download, Printer } from "lucide-react";
import { CarteMembre } from "@/components/carte/CarteMembre";
import { Bouton } from "@/components/ui/Bouton";
import { choristeConnecte } from "@/lib/demo-data";

export const metadata = { title: "Ma carte de choriste" };

export default function MaCarte() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-marine-900">Ma carte de choriste</h1>
      <CarteMembre membre={choristeConnecte} />
      <div className="grid grid-cols-2 gap-3">
        <Bouton variante="secondaire"><Download className="size-4" aria-hidden /> PDF</Bouton>
        <Bouton variante="secondaire"><Printer className="size-4" aria-hidden /> Imprimer</Bouton>
      </div>
      <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">
        Carte perdue ? Signalez-le à votre responsable de paroisse : l&apos;ancienne carte sera
        révoquée et une nouvelle vous sera délivrée.
      </p>
    </div>
  );
}
