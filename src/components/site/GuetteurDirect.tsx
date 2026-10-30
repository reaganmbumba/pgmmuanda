"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Recharge la page « Direct » toutes les 2 minutes : un direct qui commence s'affiche tout seul. */
export function GuetteurDirect() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 120_000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
