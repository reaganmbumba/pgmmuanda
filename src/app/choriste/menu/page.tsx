import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";
import { menuChoriste } from "@/lib/navigation";

export const metadata = { title: "Menu" };

export default function MenuChoriste() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Menu</h1>
      <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
        {menuChoriste.map(({ href, label, icone: Icone }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 px-4 py-3.5">
              <span className="rounded-lg bg-marine-50 p-2 text-marine-800">
                <Icone className="size-4.5" aria-hidden />
              </span>
              <span className="flex-1 text-sm font-medium text-marine-900">{label}</span>
              <ChevronRight className="size-4 text-slate-300" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/connexion"
        className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-red-600 shadow-sm"
      >
        <LogOut className="size-4" aria-hidden /> Se déconnecter
      </Link>
    </div>
  );
}
