/** Lecteur YouTube (sans cookies publicitaires) au format 16:9. */
export function LecteurVideo({ id, titre, direct = false }: { id: string; titre: string; direct?: boolean }) {
  return (
    <div className="lecteur">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${direct ? "&autoplay=1&mute=1" : ""}`}
        title={titre}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
