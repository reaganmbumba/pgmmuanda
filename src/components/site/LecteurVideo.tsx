/**
 * Lecteur YouTube (sans cookies publicitaires) au format 16:9, dans le site.
 * Avec une liste de lecture, les vidéos de la chaîne s'enchaînent comme à la télévision.
 */
export function LecteurVideo({ id, liste, titre, auto = false }: { id?: string; liste?: string | null; titre: string; auto?: boolean }) {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
  if (liste) params.set("list", liste);
  if (auto) { params.set("autoplay", "1"); params.set("mute", "1"); }
  const src = id ? `https://www.youtube-nocookie.com/embed/${id}?${params}` : `https://www.youtube-nocookie.com/embed/videoseries?${params}`;
  return (
    <div className="lecteur">
      <iframe
        src={src}
        title={titre}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
