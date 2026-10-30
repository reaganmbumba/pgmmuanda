import "server-only";

/*
 * Chaîne YouTube de la PGM, lue sans clé d'API : la page publique de la chaîne
 * (identifiant, abonnés, direct en cours) et son flux RSS (dernières vidéos).
 * Toute erreur donne une page « Direct » simple avec le bouton S'abonner.
 */

export type Video = { id: string; titre: string; date: string };
export type Chaine = {
  lien: string;
  /** Liste de lecture de toutes les vidéos publiées (UU + identifiant) : lisible dans le site même sans le flux. */
  listeVideos: string | null;
  lienAbonnement: string;
  id: string | null;
  abonnes: string | null;
  direct: string | null;
  videos: Video[];
};

// Le cookie évite la page « Avant d'accéder à YouTube » (consentement) servie aux serveurs
const ENTETES = {
  "Accept-Language": "fr-FR,fr;q=0.9",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Cookie: "CONSENT=YES+cb; SOCS=CAI",
};

/** Identifiant de la chaîne @pgmmuanda, utilisé quand l'administration n'en a pas donné. */
export const ID_CHAINE_PGM = "UCdg6aGoM6lstsz2f-or-O9A";

async function lire(url: string, secondes: number): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: ENTETES, next: { revalidate: secondes }, signal: AbortSignal.timeout(6000) });
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}

const decoder = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** « 1,2 k abonnés » → « 1,2 k » */
function abonnesDepuis(page: string): string | null {
  const m = page.match(/"subscriberCountText":\{[^}]*?"(?:simpleText|content)":"([^"]+)"/)
    ?? page.match(/"content":"([^"]*?(?:abonnés|abonné|subscribers?))"/);
  if (!m) return null;
  const n = m[1].replace(/\s*(abonnés|abonné|subscribers?)\s*$/i, "").replace(/ /g, " ").trim();
  return n || null;
}

export async function lireChaine(nom: string, idManuel: string): Promise<Chaine> {
  const pseudo = nom.replace(/^@/, "").trim() || "pgmmuanda";
  const lien = `https://www.youtube.com/@${encodeURIComponent(pseudo)}`;
  const chaine: Chaine = { lien, listeVideos: null, lienAbonnement: `${lien}?sub_confirmation=1`, id: null, abonnes: null, direct: null, videos: [] };

  const page = await lire(lien, 3600);
  chaine.id = /^UC[\w-]{22}$/.test(idManuel) ? idManuel
    : page?.match(/"(?:externalId|channelId)":"(UC[\w-]{22})"/)?.[1]
      ?? page?.match(/youtube\.com\/channel\/(UC[\w-]{22})/)?.[1]
      ?? (pseudo.toLowerCase() === "pgmmuanda" ? ID_CHAINE_PGM : null);
  if (page) chaine.abonnes = abonnesDepuis(page);
  if (!chaine.id) return chaine;
  chaine.listeVideos = `UU${chaine.id.slice(2)}`;

  const [flux, direct] = await Promise.all([
    lire(`https://www.youtube.com/feeds/videos.xml?channel_id=${chaine.id}`, 600),
    lire(`https://www.youtube.com/channel/${chaine.id}/live`, 120),
  ]);
  if (flux) {
    chaine.videos = [...flux.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(([, e]) => {
      const id = e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
      const titre = e.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const date = e.match(/<published>([^<]+)<\/published>/)?.[1];
      return id && titre ? [{ id, titre: decoder(titre), date: date ?? "" }] : [];
    });
  }
  // Un direct en cours : la page /live renvoie vers la vidéo et la marque « isLiveNow »
  if (direct && /"isLiveNow":true/.test(direct)) {
    chaine.direct = direct.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/)?.[1]
      ?? direct.match(/"videoId":"([\w-]{11})"/)?.[1] ?? null;
  }
  return chaine;
}
