"use client";

import { createContext, useContext } from "react";

/**
 * Compte en lecture seule (Président de l'antenne) : il voit tout l'espace staff,
 * mais les formulaires et boutons qui modifient ne s'affichent pas. La base refuse
 * de toute façon ses modifications.
 */
const Contexte = createContext(false);

export function LectureSeuleProvider({ actif, children }: { actif: boolean; children: React.ReactNode }) {
  return <Contexte.Provider value={actif}>{children}</Contexte.Provider>;
}

export const useLectureSeule = () => useContext(Contexte);

/** N'affiche son contenu que pour les comptes qui peuvent modifier. */
export function SiModifiable({ children }: { children: React.ReactNode }) {
  return useLectureSeule() ? null : <>{children}</>;
}
