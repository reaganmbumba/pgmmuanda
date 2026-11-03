import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";
import { deconnexion } from "@/app/(auth)/actions";
import { menuChoriste } from "@/lib/navigation";

export const metadata = { title: "Menu" };

export default function MenuChoriste() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-marine-900">Menu</h1>
      <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
        {menuChoriste.map(({ href, label, description, icone: Icone }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-slate-50">
              <span className="rounded-xl bg-marine-50 p-2.5 text-marine-800">
                <Icone className="size-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block text-base font-medium text-marine-900">{label}</span>
                <span className="block text-xs text-slate-500">{description}</span>
              </span>
              <ChevronRight className="size-4 text-slate-300" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <form action={deconnexion}>
        <button
          type="submit"
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-base font-semibold text-red-600 shadow-sm"
        >
          <LogOut className="size-4" aria-hidden /> Se déconnecter
        </button>
      </form>
    </div>
  );
}
