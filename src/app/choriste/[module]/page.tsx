import { notFound } from "next/navigation";
import { ModulePrevu } from "@/components/ui/ModulePrevu";
import { menuChoriste } from "@/lib/navigation";

// Modules qui ont déjà leur propre page : exclus de cette route générique.
const PAGES_DEDIEES = ["annonces", "carte", "menu", "notifications", "paroisse", "presences", "profil", "programme", "qr"];

const entree = (slug: string) => menuChoriste.find((e) => e.href === `/choriste/${slug}`);

export function generateStaticParams() {
  return menuChoriste
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
  return <ModulePrevu entree={e} />;
}
