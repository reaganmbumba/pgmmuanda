import { QRCodeSVG } from "qrcode.react";
import { lienVerification } from "@/lib/cartes/lien";
import { formatDate, initiales, libelleParoisse } from "@/lib/format";

export type DonneesCarte = {
  prenom: string;
  nom: string;
  postnom: string;
  matricule: string;
  fonction: string;
  paroisse: string;
  photo?: string | null;
  carte: { reference: string; statut: string; dateEmission: string };
};

/** Petit titre doré au-dessus d'une information de la carte. */
function Champ({ libelle, children, className = "" }: { libelle: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[1.8cqw] font-bold uppercase tracking-wider text-or-500">{libelle}</p>
      <p className="truncate text-[2.8cqw] font-bold leading-tight">{children}</p>
    </div>
  );
}

/**
 * Carte de membre au format portefeuille (ratio ISO 7810 ID-1 : 85,6 × 54 mm).
 * Même présentation que la carte imprimée (src/lib/cartes/pdf.ts).
 */
export function CarteMembre({ membre }: { membre: DonneesCarte }) {
  const revoquee = membre.carte.statut !== "Active";
  // Le QR ne contient qu'un lien de vérification, jamais de données personnelles.
  const lien = lienVerification(membre.carte.reference);
  return (
    <div className="relative aspect-[85.6/54] w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-marine-900 to-marine-950 text-white shadow-xl ring-1 ring-marine-950/40 @container">
      {/* Filigrane du logo et portée musicale */}
      {/* eslint-disable-next-line @next/next/no-img-element -- image décorative */}
      <img src="/logo-pgm.png" alt="" aria-hidden className="pointer-events-none absolute left-[36%] top-[22%] w-[43%] opacity-[0.06]" />
      <svg aria-hidden viewBox="0 0 100 12" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-[24%] h-[9%] w-full text-or-500/25">
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M0 ${3 + i * 1.6} C25 ${-3 + i * 1.6} 45 ${9 + i * 1.6} 70 ${3 + i * 1.6} S95 ${0 + i * 1.6} 100 ${3 + i * 1.6}`} fill="none" stroke="currentColor" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>

      <div className="relative flex h-full flex-col">
        {/* En-tête */}
        <div className="mx-[3.7cqw] flex items-center gap-[2.5cqw] border-b border-or-500/70 py-[2.2cqw]">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo fixe */}
          <img src="/logo-pgm.png" alt="Logo PGM Muanda" className="size-[9cqw]" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[3.4cqw] font-bold tracking-wide">PGM ANTENNE DE MUANDA</p>
            <p className="truncate text-[1.9cqw] text-or-400">PRÉSIDENCE GÉNÉRALE DE LA MUSIQUE · EBNM KCC</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- logo fixe */}
          <img src="/logo-kcc.png" alt="Logo KCC" className="size-[7cqw]" />
        </div>

        <div className="mx-[3.7cqw] mt-[1.8cqw] flex items-center justify-between">
          <span className="rounded-full bg-or-500 px-[2.4cqw] py-[0.5cqw] text-[2.1cqw] font-bold tracking-wide text-marine-950">
            CARTE DE MEMBRE
          </span>
          <span className="ml-auto mr-[1.6cqw] text-[1.9cqw] text-marine-100/80">Émise le {formatDate(membre.carte.dateEmission)}</span>
          <span
            className={`rounded-full px-[2cqw] py-[0.4cqw] text-[2.2cqw] font-semibold uppercase tracking-wide ${
              revoquee ? "bg-red-500/90 text-white" : "bg-emerald-400/90 text-marine-950"
            }`}
          >
            {revoquee ? membre.carte.statut : "Valide"}
          </span>
        </div>

        {/* Corps : photo, identité, QR */}
        <div className="mx-[4cqw] mt-auto mb-[2.4cqw] flex items-end gap-[3.2cqw]">
          <div className="shrink-0 rounded-[1.2cqw] bg-or-500 p-[0.8cqw]">
            {membre.photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- image intégrée (data:), pas d'optimisation possible
              <img src={membre.photo} alt="" className="block h-[26cqw] w-[20cqw] object-cover" />
            ) : (
              <span className="flex h-[26cqw] w-[20cqw] items-center justify-center bg-marine-100 text-[7cqw] font-bold text-marine-900" aria-hidden>
                {initiales(membre)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-[0.9cqw]">
            <div>
              <p className="truncate text-[3.4cqw] font-bold leading-tight">
                {membre.prenom} {membre.nom.toUpperCase()}
              </p>
              {membre.postnom && <p className="truncate text-[2.1cqw] uppercase text-marine-100/80">{membre.postnom}</p>}
            </div>
            <div>
              <p className="text-[1.8cqw] font-bold uppercase tracking-wider text-or-500">Matricule</p>
              <p className="truncate text-[3.3cqw] font-bold leading-tight tracking-wide text-or-400">{membre.matricule}</p>
            </div>
            <Champ libelle="Fonction">{membre.fonction}</Champ>
            <Champ libelle="Paroisse">{libelleParoisse(membre.paroisse)}</Champ>
          </div>
          <div className="shrink-0 text-center">
            <div className="rounded-[1.4cqw] bg-white p-[1.2cqw] ring-1 ring-or-500">
              <QRCodeSVG value={lien} size={256} className="size-[18cqw]" level="M" data-qr={lien} fgColor="#0b1f4b" />
            </div>
            <p className="mt-[1cqw] text-[1.6cqw] font-bold tracking-wide text-or-400">SCANNER POUR VÉRIFIER</p>
          </div>
        </div>

        {/* Pied */}
        <div className="flex items-center justify-between border-t-[0.5cqw] border-or-500 bg-marine-950 px-[4cqw] py-[1.2cqw] text-[1.7cqw]">
          <span className="truncate text-marine-100/80">Membre de la Présidence générale de la Musique Antenne de Muanda</span>
          <span className="shrink-0 font-bold text-or-400">www.pgmmuanda.com</span>
        </div>
      </div>
    </div>
  );
}
