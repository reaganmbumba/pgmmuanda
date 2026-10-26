import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-marine-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -left-24 -top-24 size-96 rounded-full border-[24px] border-or-500/10" />
        <div className="absolute -bottom-32 -right-20 size-[28rem] rounded-full border-[32px] border-or-500/10" />
        <div />
        <div className="relative">
          <Image src="/logo-pgm.png" alt="Logo PGM Muanda — EBNM KCC" width={168} height={168} priority unoptimized
            className="mb-10 drop-shadow-[0_12px_32px_rgba(0,0,0,0.35)]" />
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
        <p className="relative text-xs text-marine-100/50">PGM MUANDA DIGITAL — EBNM KCC</p>
      </aside>
      <main className="flex flex-col lg:items-center lg:justify-center lg:px-4 lg:py-10">
        {/* Téléphone : bandeau avec le logo */}
        <div className="relative overflow-hidden bg-marine-900 px-4 pb-14 pt-10 text-center lg:hidden">
          <div className="absolute -right-16 -top-16 size-56 rounded-full border-[18px] border-or-500/10" />
          <Image src="/logo-pgm.png" alt="Logo PGM Muanda — EBNM KCC" width={112} height={112} priority unoptimized
            className="relative mx-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]" />
          <p className="relative mt-4 text-lg font-bold tracking-wide text-white">PGM MUANDA DIGITAL</p>
          <p className="relative text-xs font-medium tracking-[0.25em] text-or-400">EBNM KCC</p>
        </div>
        <div className="relative -mt-8 w-full flex-1 rounded-t-3xl bg-marine-50 px-5 pb-10 pt-8 lg:mt-0 lg:max-w-sm lg:flex-none lg:rounded-none lg:bg-transparent lg:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
