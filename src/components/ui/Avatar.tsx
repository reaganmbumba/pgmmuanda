import { initiales } from "@/lib/format";

export function Avatar({
  membre,
  taille = "md",
}: {
  membre: { prenom: string; nom: string; photo?: string | null };
  taille?: "sm" | "md" | "lg" | "xl";
}) {
  const t = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-lg",
    xl: "size-24 text-2xl",
  }[taille];
  if (membre.photo)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- image intégrée (data:), pas d'optimisation possible
      <img src={membre.photo} alt="" className={`shrink-0 rounded-full object-cover ring-2 ring-white ${t}`} />
    );
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-marine-100 font-semibold text-marine-800 ring-2 ring-white ${t}`}
      aria-hidden
    >
      {initiales(membre)}
    </span>
  );
}
