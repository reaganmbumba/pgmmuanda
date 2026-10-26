import { Download } from "lucide-react";
import { CarteMembre } from "@/components/carte/CarteMembre";
import { SansCarte } from "@/components/carte/SansCarte";
import { maCarte } from "@/lib/cartes/ma-carte";

export const metadata = { title: "Ma carte de choriste" };

export default async function MaCarte() {
  const { donnees, carteId, relie } = await maCarte();
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-marine-900">Ma carte de choriste</h1>
      {donnees ? <CarteMembre membre={donnees} /> : <SansCarte relie={relie} />}
      {carteId && (
        <a href={`/cartes/${carteId}/pdf`} target="_blank" rel="noopener"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-marine-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
          <Download className="size-4" aria-hidden /> Télécharger ma carte (PDF)
        </a>
      )}
      <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">
        Carte perdue ? Signalez-le à votre responsable de paroisse : l&apos;ancienne carte sera
        révoquée et une nouvelle vous sera délivrée.
      </p>
    </div>
  );
}
