import { QRCodeSVG } from "qrcode.react";
import { SansCarte } from "@/components/carte/SansCarte";
import { lienVerification } from "@/lib/cartes/lien";
import { maCarte } from "@/lib/cartes/ma-carte";

export const metadata = { title: "Mon QR code" };

export default async function MonQr() {
  const { donnees: moi, relie } = await maCarte();
  if (!moi) return <SansCarte relie={relie} />;
  const lien = lienVerification(moi.carte.reference);
  return (
    <div className="flex flex-col items-center pt-4 text-center">
      <h1 className="text-xl font-bold text-marine-900">Mon QR code</h1>
      <p className="mt-1 text-sm text-slate-500">Présentez ce code lors des contrôles et des appels.</p>
      <div className="mt-6 rounded-3xl bg-white p-6 shadow-lg ring-4 ring-or-400/60">
        <QRCodeSVG value={lien} size={240} level="M" fgColor="#0b1f4b" data-qr={lien} />
      </div>
      <p className="mt-5 text-lg font-semibold text-marine-900">{moi.prenom} {moi.nom}</p>
      <p className="font-mono text-or-600">{moi.matricule}</p>
      <p className="mt-4 max-w-xs text-xs text-slate-400">
        Ce code ne contient aucune donnée personnelle : seulement un lien de vérification sécurisé.
      </p>
    </div>
  );
}
