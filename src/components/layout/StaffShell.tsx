"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { deconnexion } from "@/app/(auth)/actions";
import { peutOuvrir, type Role } from "@/lib/auth/roles";
import { menuStaff } from "@/lib/navigation";

type Utilisateur = { nom: string; libelleRole: string; role: Role };

function estActif(pathname: string, href: string) {
  return href === "/staff" ? pathname === href : pathname.startsWith(href);
}

function MenuLateral({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex h-full flex-col bg-marine-900 text-marine-100">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Logo size={36} avecTexte clair />
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {menuStaff.filter((e) => peutOuvrir(role, e.href)).map(({ href, label, icone: Icone }) => {
          const actif = estActif(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={actif ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  actif
                    ? "bg-white/10 text-white shadow-[inset_3px_0_0_var(--color-or-500)]"
                    : "text-marine-100/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icone
                  className={`size-4.5 shrink-0 ${actif ? "text-or-400" : ""}`}
                  aria-hidden
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-white/10 p-3">
        <form action={deconnexion}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-marine-100/80 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-4.5" aria-hidden />
            Déconnexion
          </button>
        </form>
      </div>
    </nav>
  );
}

function Cloche({ nonLues, panneau }: { nonLues: number; panneau?: React.ReactNode }) {
  // Le panneau est lié à la page où il a été ouvert : changer de page le referme.
  const pathname = usePathname();
  const [ouvertSur, setOuvertSur] = useState<string | null>(null);
  const ouvert = ouvertSur === pathname;
  const setOuvert = (o: boolean) => setOuvertSur(o ? pathname : null);
  const zone = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => { if (!zone.current?.contains(e.target as Node)) setOuvertSur(null); };
    document.addEventListener("click", fermer);
    return () => document.removeEventListener("click", fermer);
  }, [ouvert]);
  return (
    <div ref={zone} className="relative">
      <button
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        aria-label={nonLues ? `Notifications (${nonLues} non lues)` : "Notifications"}
        aria-expanded={ouvert}
        onClick={() => setOuvert(!ouvert)}
      >
        <Bell className="size-5" />
        {nonLues > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4.5 items-center justify-center rounded-full bg-or-500 px-1 text-[10px] font-bold text-marine-950">
            {nonLues > 99 ? "99+" : nonLues}
          </span>
        )}
      </button>
      {ouvert && panneau && (
        <div className="absolute right-0 top-12 z-50 max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <p className="px-3 pb-1 pt-2 text-sm font-semibold text-marine-900">Notifications</p>
          {panneau}
        </div>
      )}
    </div>
  );
}

export function StaffShell({ children, utilisateur, nonLues = 0, panneauNotifications }: {
  children: React.ReactNode;
  utilisateur: Utilisateur;
  nonLues?: number;
  panneauNotifications?: React.ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="flex min-h-[calc(100dvh-28px)]">
      <aside className="hidden w-68 shrink-0 bg-marine-900 lg:block">
        <div className="sticky top-0 h-[calc(100dvh-28px)]">
          <MenuLateral role={utilisateur.role} />
        </div>
      </aside>

      {ouvert && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal>
          <button
            className="absolute inset-0 bg-marine-950/60"
            aria-label="Fermer le menu"
            onClick={() => setOuvert(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <MenuLateral role={utilisateur.role} onNavigate={() => setOuvert(false)} />
            <button
              onClick={() => setOuvert(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-white/80 hover:bg-white/10"
              aria-label="Fermer le menu"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 text-marine-900 hover:bg-slate-100 lg:hidden"
            onClick={() => setOuvert(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </button>
          {peutOuvrir(utilisateur.role, "/staff/membres") && (
            <form action="/staff/membres" role="search" className="relative hidden max-w-md flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                name="q"
                aria-label="Rechercher un membre"
                placeholder="Rechercher un membre, un matricule…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-marine-700 focus:bg-white"
              />
            </form>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Cloche nonLues={nonLues} panneau={panneauNotifications} />
            <div className="flex items-center gap-2 rounded-xl px-2 py-1">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-marine-900 text-xs font-semibold text-or-400">
                {utilisateur.nom.slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden text-sm leading-tight sm:block">
                <span className="block font-semibold text-marine-900">
                  {utilisateur.nom}
                </span>
                <span className="block text-xs text-slate-500">
                  {utilisateur.libelleRole}
                </span>
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
