import { redirect } from "next/navigation";
import { ModulePrevu } from "@/components/ui/ModulePrevu";
import { menuStaff } from "@/lib/navigation";
import { supabaseActif } from "@/lib/supabase/config";

export const metadata = { title: "Chorales" };

// Les chorales se gèrent avec leur paroisse.
export default function PageChorales() {
  if (!supabaseActif) return <ModulePrevu entree={menuStaff.find((e) => e.href === "/staff/chorales")!} />;
  redirect("/staff/paroisses");
}
