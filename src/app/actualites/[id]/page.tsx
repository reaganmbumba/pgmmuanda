import { notFound } from "next/navigation";
import { PageActualite } from "@/components/site/SitePublic";
import { lireElement } from "@/lib/site/contenu";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const a = await lireElement((await params).id);
  return { title: a?.titre ?? "Actualité", description: a?.sousTitre ?? undefined };
}

export default async function Page({ params }: Props) {
  const page = await PageActualite({ id: (await params).id });
  if (!page) notFound();
  return page;
}
