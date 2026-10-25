import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-marine-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -left-24 -top-24 size-96 rounded-full border-[24px] border-or-500/10" />
        <div className="absolute -bottom-32 -right-20 size-[28rem] rounded-full border-[32px] border-or-500/10" />
        <Logo size={56} avecTexte clair />
        <div className="relative">
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
      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size={56} avecTexte />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
