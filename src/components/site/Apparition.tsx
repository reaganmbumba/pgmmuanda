"use client";

import { useEffect } from "react";

/**
 * Fait apparaître en douceur les blocs marqués data-apparait quand ils entrent à l'écran.
 * Sans JavaScript, ou si le téléphone demande moins d'animations, tout reste visible tout de suite.
 */
export function Apparition() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const racine = document.querySelector(".site-pgm");
    const blocs = Array.from(document.querySelectorAll<HTMLElement>("[data-apparait]"));
    // Ce qui est déjà à l'écran au chargement reste affiché, sans saut.
    blocs.forEach((b) => { if (b.getBoundingClientRect().top < window.innerHeight) b.classList.add("vu"); });
    racine?.classList.add("anim");
    const obs = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("vu"); obs.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    blocs.forEach((b) => { if (!b.classList.contains("vu")) obs.observe(b); });
    return () => { obs.disconnect(); racine?.classList.remove("anim"); };
  }, []);
  return null;
}
