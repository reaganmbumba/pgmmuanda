import { imageVideo, PageDirect } from "@/components/site/SitePublic";
import { metaPartage } from "@/lib/site/partage";

type Props = { searchParams: Promise<{ v?: string }> };
const video = (v: unknown) => (typeof v === "string" && /^[\w-]{11}$/.test(v) ? v : undefined);

export async function generateMetadata({ searchParams }: Props) {
  const v = video((await searchParams).v);
  return metaPartage({
    titre: "PGM Muanda TV · Direct",
    texte: "Les vidéos et les directs de la PGM Antenne de Muanda.",
    image: v ? imageVideo(v) : null,
    chemin: v ? `/direct?v=${v}` : "/direct",
  });
}

export default async function Page({ searchParams }: Props) {
  return <PageDirect v={video((await searchParams).v)} />;
}
