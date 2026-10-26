"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { Bouton } from "@/components/ui/Bouton";

/**
 * Lecture des QR codes par la caméra (jsQR, fonctionne sur tous les navigateurs récents).
 * Appelle `surCode` à chaque code lu ; un même code n'est relu qu'après 4 secondes.
 */
export function LecteurQR({ surCode }: { surCode: (texte: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const flux = useRef<MediaStream | null>(null);
  const dernier = useRef<{ texte: string; t: number }>({ texte: "", t: 0 });
  const rappel = useRef(surCode);
  const [camera, setCamera] = useState<"arret" | "demarrage" | "active">("arret");
  const [erreurCamera, setErreurCamera] = useState<string | null>(null);

  useEffect(() => { rappel.current = surCode; }, [surCode]);

  function arreter() {
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
    setCamera("arret");
  }

  async function activer() {
    setErreurCamera(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErreurCamera("Ce navigateur ne donne pas accès à la caméra. Utilisez la recherche par matricule.");
      return;
    }
    setCamera("demarrage");
    try {
      flux.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      video.current!.srcObject = flux.current;
      await video.current!.play();
      setCamera("active");
    } catch (e) {
      setCamera("arret");
      setErreurCamera(
        (e as DOMException)?.name === "NotAllowedError"
          ? "Accès à la caméra refusé. Autorisez-le dans les réglages du navigateur."
          : "Caméra indisponible. La lecture nécessite une connexion sécurisée (https).",
      );
    }
  }

  // Analyse des images de la caméra
  useEffect(() => {
    if (camera !== "active") return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    let image = 0;
    const lire = () => {
      const v = video.current;
      if (v && v.readyState >= 2 && v.videoWidth) {
        const echelle = Math.min(1, 640 / v.videoWidth);
        canvas.width = v.videoWidth * echelle;
        canvas.height = v.videoHeight * echelle;
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });
        const maintenant = Date.now();
        // Évite de traiter dix fois la même carte tenue devant la caméra
        if (code?.data && (code.data !== dernier.current.texte || maintenant - dernier.current.t > 4000)) {
          dernier.current = { texte: code.data, t: maintenant };
          navigator.vibrate?.(80);
          rappel.current(code.data);
        }
      }
      image = requestAnimationFrame(lire);
    };
    image = requestAnimationFrame(lire);
    return () => cancelAnimationFrame(image);
  }, [camera]);

  useEffect(() => arreter, []);

  return (
    <div className="space-y-4">
      <div className="relative flex aspect-square max-h-[420px] w-full items-center justify-center overflow-hidden rounded-2xl bg-marine-950">
        <video ref={video} muted playsInline className={`absolute inset-0 size-full object-cover ${camera === "active" ? "" : "hidden"}`} />
        <div className="pointer-events-none absolute inset-[18%] rounded-3xl border-4 border-or-400/80" />
        {camera !== "active" && (
          <div className="relative px-8 text-center text-marine-100">
            <Camera className="mx-auto size-10 text-or-400" aria-hidden />
            <p className="mt-3 font-medium text-white">Placez le QR code dans le cadre</p>
            <p className="mt-1 text-sm text-marine-100/70">Activez la caméra pour scanner une carte.</p>
          </div>
        )}
      </div>
      {camera === "active" ? (
        <Bouton variante="secondaire" className="w-full" onClick={arreter}>
          <CameraOff className="size-4" aria-hidden /> Arrêter la caméra
        </Bouton>
      ) : (
        <Bouton variante="or" className="w-full" onClick={activer} disabled={camera === "demarrage"}>
          {camera === "demarrage" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
          Activer la caméra
        </Bouton>
      )}
      {erreurCamera && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{erreurCamera}</p>}
    </div>
  );
}
