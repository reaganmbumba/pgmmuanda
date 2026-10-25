import { Construction } from "lucide-react";
import type { EntreeMenu } from "@/lib/navigation";

export function ModulePrevu({ entree }: { entree: EntreeMenu }) {
  const Icone = entree.icone;
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <span className="mx-auto inline-flex rounded-2xl bg-marine-50 p-4 text-marine-800">
        <Icone className="size-8" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-bold text-marine-900">{entree.label}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{entree.description}</p>
      <p className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-or-100 px-3 py-1 text-xs font-semibold text-or-600">
        <Construction className="size-3.5" aria-hidden />
        Module prévu à l&apos;Étape {entree.etape}
      </p>
    </div>
  );
}
