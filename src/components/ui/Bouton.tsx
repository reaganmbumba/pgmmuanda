import Link from "next/link";

const styles = {
  principal:
    "bg-marine-900 text-white hover:bg-marine-800 focus-visible:outline-marine-900",
  or: "or-degrade text-marine-950 hover:brightness-105 focus-visible:outline-or-500",
  secondaire:
    "bg-white text-marine-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-marine-900",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
} as const;

type Props = {
  variante?: keyof typeof styles;
  href?: string;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Bouton({
  variante = "principal",
  href,
  className = "",
  children,
  ...rest
}: Props) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${styles[variante]} ${className}`;
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
