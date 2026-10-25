import { FlaskConical } from "lucide-react";

export function BandeauDemo() {
  return (
    <div className="flex items-center justify-center gap-2 bg-or-100 px-4 py-1.5 text-center text-xs font-medium text-or-600">
      <FlaskConical className="size-3.5 shrink-0" aria-hidden />
      Maquette — données de démonstration fictives, aucune donnée réelle n&apos;est
      enregistrée.
    </div>
  );
}
