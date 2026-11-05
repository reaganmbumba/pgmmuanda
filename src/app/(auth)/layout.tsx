import Image from "next/image";
import { InstallerApp } from "@/components/InstallerApp";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-marine-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -left-24 -top-24 size-96 rounded-full border-[24px] border-or-500/10" />
        <div className="absolute -bottom-32 -right-20 size-[28rem] rounded-full border-[32px] border-or-500/10" />
        <div />
        <div className="relative">
          <Image src="/logo-pgm.png" alt="Logo PGM Muanda — EBNM KCC" width={168} height={168} priority unoptimized
            className="mb-6 drop-shadow-[0_12px_32px_rgba(0,0,0,0.35)]" />
          <p className="text-2xl font-bold tracking-wide text-white">PGM ANTENNE DE MUANDA</p>
          <p className="mb-10 text-sm font-medium tracking-[0.3em] text-or-400">EBNM KCC</p>
          <p className="text-4xl font-bold leading-tight text-white">
            Servir Dieu par le chant,
            <br />
            <span className="text-or-400">ensemble et en ordre.</span>
          </p>
          <p className="mt-4 max-w-md text-marine-100/80">
            La plateforme de la Présidence générale de la musique de Muanda : membres,
            cartes, programmes, présences et communication en un seul endroit.
          </p>
        </div>
        <p className="relative text-xs text-marine-100/50">PGM ANTENNE DE MUANDA — EBNM KCC</p>
      </aside>
      <main className="flex flex-col lg:items-center lg:justify-center lg:px-4 lg:py-10">
        {/* Téléphone : petit bandeau avec le logo, pour voir le formulaire tout de suite */}
        <div className="relative flex items-center justify-center gap-3 overflow-hidden bg-marine-900 px-4 pb-9 pt-4 lg:hidden">
          <Image src="/logo-pgm.png" alt="Logo PGM Muanda — EBNM KCC" width={52} height={52} priority unoptimized
            className="relative drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]" />
          <div className="relative text-left">
            <p className="text-base font-bold leading-tight tracking-wide text-white">PGM ANTENNE DE MUANDA</p>
            <p className="text-[11px] font-medium tracking-[0.25em] text-or-400">EBNM KCC</p>
          </div>
        </div>
        <div className="relative -mt-6 w-full flex-1 rounded-t-3xl bg-marine-50 px-5 pb-10 pt-6 lg:mt-0 lg:max-w-sm lg:flex-none lg:rounded-none lg:bg-transparent lg:p-0">
          {children}
          <div className="mt-8"><InstallerApp /></div>
        </div>
      </main>
    </div>
  );
}
