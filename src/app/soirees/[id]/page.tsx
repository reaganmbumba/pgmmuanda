import { notFound } from "next/navigation";
import { PagePublication } from "@/components/site/SitePublic";
import { metaPublication } from "@/lib/site/partage";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return metaPublication(id, `/soirees/${id}`, "Soirée musicale");
}

export default async function Page({ params }: Props) {
  const page = await PagePublication({ id: (await params).id, rubrique: "soiree" });
  if (!page) notFound();
  return page;
}
