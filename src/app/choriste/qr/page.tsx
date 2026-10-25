import { QRCodeSVG } from "qrcode.react";
import { choristeConnecte as moi } from "@/lib/demo-data";

export const metadata = { title: "Mon QR code" };

export default function MonQr() {
  return (
    <div className="flex flex-col items-center pt-4 text-center">
      <h1 className="text-xl font-bold text-marine-900">Mon QR code</h1>
      <p className="mt-1 text-sm text-slate-500">Présentez ce code lors des contrôles et des appels.</p>
      <div className="mt-6 rounded-3xl bg-white p-6 shadow-lg ring-4 ring-or-400/60">
        <QRCodeSVG
          value={`https://pgm-muanda.example/verifier/${moi.carte.reference}`}
          size={240}
          level="M"
          fgColor="#0b1f4b"
        />
      </div>
      <p className="mt-5 text-lg font-semibold text-marine-900">{moi.prenom} {moi.nom}</p>
      <p className="font-mono text-or-600">{moi.matricule}</p>
      <p className="mt-4 max-w-xs text-xs text-slate-400">
        Ce code ne contient aucune donnée personnelle : seulement un lien de vérification sécurisé.
      </p>
    </div>
  );
}
