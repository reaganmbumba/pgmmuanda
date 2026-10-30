import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const dev = process.env.NODE_ENV !== "production";

/**
 * Politique de sécurité du contenu : le navigateur ne charge que ce qui vient
 * du site lui-même et de la base Supabase. Une page ne peut pas être affichée
 * dans le cadre d'un autre site (protection contre le « clickjacking »).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Le site public montre les vidéos de la chaîne YouTube de la PGM et ses audios
  `img-src 'self' data: blob: https://i.ytimg.com${supabase ? ` ${supabase}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${supabase ? ` ${supabase} ${supabase.replace(/^http/, "ws")}` : ""}`,
  `media-src 'self' blob:${supabase ? ` ${supabase}` : ""}`,
  "frame-src https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const entetes = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // La caméra sert uniquement au scanner de cartes, sur ce site
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Fichiers déposés : 4 Mo au plus (+ marge pour l'enveloppe du formulaire)
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
  // Ancienne adresse de l'article, déjà partagée : il vit maintenant dans la liste des actualités
  async redirects() {
    return [{ source: "/actualites/numerique", destination: "/actualites", permanent: false }];
  },
  async headers() {
    return [
      { source: "/((?!fichiers/).*)", headers: entetes },
      // Les fichiers téléchargés reçoivent leur propre politique (voir app/fichiers/[id]/route.ts)
      { source: "/fichiers/:id", headers: entetes.filter((e) => e.key !== "Content-Security-Policy") },
    ];
  },
};

export default nextConfig;
