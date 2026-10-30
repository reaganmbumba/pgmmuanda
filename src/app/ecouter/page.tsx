import { PageEcouter } from "@/components/site/SitePublic";

export const metadata = { title: "Écouter", description: "Les audios des répétitions des chorales de la PGM Antenne de Muanda." };

export default async function Page({ searchParams }: { searchParams: Promise<{ chorale?: string }> }) {
  const { chorale } = await searchParams;
  return <PageEcouter chorale={typeof chorale === "string" ? chorale : undefined} />;
}
