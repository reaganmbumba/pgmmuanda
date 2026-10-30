import { PageDirect } from "@/components/site/SitePublic";

export const metadata = { title: "Direct", description: "Les vidéos et les directs de la PGM Antenne de Muanda sur YouTube." };

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  return <PageDirect v={typeof v === "string" && /^[\w-]{11}$/.test(v) ? v : undefined} />;
}
