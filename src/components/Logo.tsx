import Image from "next/image";

type Props = {
  size?: number;
  avecTexte?: boolean;
  clair?: boolean;
};

export function Logo({ size = 40, avecTexte = false, clair = false }: Props) {
  return (
    <span className="inline-flex items-center gap-3">
      <Image
        src="/logo-pgm.png"
        alt="Logo PGM Muanda"
        width={size}
        height={size}
        priority
        unoptimized
      />
      {avecTexte && (
        <span className="leading-tight">
          <span
            className={`block text-sm font-bold tracking-wide ${clair ? "text-white" : "text-marine-900"}`}
          >
            PGM ANTENNE DE MUANDA
          </span>
          <span className="block text-xs font-medium tracking-[0.2em] text-or-500">
            EBNM KCC
          </span>
        </span>
      )}
    </span>
  );
}
