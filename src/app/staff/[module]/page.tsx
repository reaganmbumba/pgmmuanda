import { notFound } from "next/navigation";
import { ModulePrevu } from "@/components/ui/ModulePrevu";
import { exigerAcces } from "@/lib/auth/session";
import { menuStaff } from "@/lib/navigation";

// Modules qui ont déjà leur propre page : exclus de cette route générique.
const PAGES_DEDIEES = ["cartes", "chorales", "communication", "membres", "paroisses", "presences", "programmes", "rapports", "scanner", "utilisateurs"];

const entree = (slug: string) => menuStaff.find((e) => e.href === `/staff/${slug}`);

export function generateStaticParams() {
  return menuStaff
    .filter((e) => e.href.split("/").length === 3)
    .map((e) => ({ module: e.href.split("/")[2] }))
    .filter((p) => !PAGES_DEDIEES.includes(p.module));
}

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return { title: entree(module)?.label };
}

export default async function PageModule({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const e = entree(module);
  if (!e || PAGES_DEDIEES.includes(module)) notFound();
  await exigerAcces(e.href);
  return <ModulePrevu entree={e} />;
}
