"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, CreditCard, Home, LayoutGrid, Megaphone } from "lucide-react";
import { Logo } from "@/components/Logo";

const onglets = [
  { href: "/choriste", label: "Accueil", icone: Home },
  { href: "/choriste/carte", label: "Carte", icone: CreditCard },
  { href: "/choriste/programme", label: "Programme", icone: CalendarDays },
  { href: "/choriste/annonces", label: "Annonces", icone: Megaphone },
  { href: "/choriste/menu", label: "Menu", icone: LayoutGrid },
];

export function ChoristeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-marine-50">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-marine-900 px-4 text-white">
        <Link href="/choriste" aria-label="Accueil">
          <Logo size={30} avecTexte clair />
        </Link>
        <Link
          href="/choriste/notifications"
          className="relative rounded-lg p-2 text-white/90 hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-or-400" />
        </Link>
      </header>
      <main className="flex-1 px-4 pb-28 pt-5">{children}</main>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        aria-label="Navigation principale"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {onglets.map(({ href, label, icone: Icone }) => {
            const actif = href === "/choriste" ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={actif ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                    actif ? "text-marine-900" : "text-slate-400"
                  }`}
                >
                  <span className={`rounded-full px-4 py-1 ${actif ? "bg-or-100 text-or-600" : ""}`}>
                    <Icone className="size-5" aria-hidden />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
