"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { creerClientNavigateur } from "@/lib/supabase/client";

type Message = { id: number; pseudo: string; texte: string; cree_le: string };

const lireLocal = (cle: string) => { try { return typeof window === "undefined" ? "" : localStorage.getItem(cle) ?? ""; } catch { return ""; } };
const ecrireLocal = (cle: string, v: string) => { try { localStorage.setItem(cle, v); } catch { /* navigation privée */ } };

/** Clé tirée au hasard, gardée par ce téléphone : elle sert seulement à limiter le débit. */
function cleAppareil() {
  let c = lireLocal("pgm-causerie-appareil");
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(c)) {
    c = Array.from(crypto.getRandomValues(new Uint8Array(18)), (o) => o.toString(36).padStart(2, "0")).join("").slice(0, 32);
    ecrireLocal("pgm-causerie-appareil", c);
  }
  return c;
}

const heure = (iso: string) => {
  const d = new Date(iso);
  const jour = d.toDateString() === new Date().toDateString() ? "" : `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · `;
  return jour + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

/**
 * La causerie : les messages arrivent toutes les quelques secondes, sans compte ni numéro.
 * Chacun écrit avec un prénom ou un surnom, retenu par son téléphone.
 */
export function Causerie({ ouverte, active }: { ouverte: boolean; active: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pseudo, setPseudo] = useState(() => lireLocal("pgm-causerie-pseudo"));
  const [moi, setMoi] = useState(pseudo);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const fil = useRef<HTMLDivElement>(null);
  const enBas = useRef(true);

  const charger = useCallback(async () => {
    if (!active) return;
    const { data } = await creerClientNavigateur().from("causerie_messages")
      .select("id, pseudo, texte, cree_le").order("cree_le", { ascending: false }).limit(80);
    if (data) setMessages((data as Message[]).reverse());
  }, [active]);

  useEffect(() => {
    const premier = setTimeout(charger, 0);
    const t = setInterval(() => { if (document.visibilityState === "visible") charger(); }, 4000);
    return () => { clearTimeout(premier); clearInterval(t); };
  }, [charger]);

  useEffect(() => {
    if (enBas.current && fil.current) fil.current.scrollTop = fil.current.scrollHeight;
  }, [messages]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const nom = pseudo.trim();
    if (nom.length < 2) return setErreur("Écrivez d'abord votre prénom ou surnom (2 lettres au moins).");
    if (!texte.trim()) return;
    setEnvoi(true); setErreur("");
    const { error } = await creerClientNavigateur().rpc("causerie_envoyer", { p_pseudo: nom, p_texte: texte, p_appareil: cleAppareil() });
    setEnvoi(false);
    if (error) return setErreur(error.code === "P0001" ? error.message : "Le message n'est pas parti. Vérifiez la connexion et réessayez.");
    ecrireLocal("pgm-causerie-pseudo", nom); setMoi(nom);
    setTexte(""); enBas.current = true;
    charger();
  }

  return (
    <div className="causerie">
      <div className="fil" ref={fil} aria-live="polite"
        onScroll={(e) => { const f = e.currentTarget; enBas.current = f.scrollHeight - f.scrollTop - f.clientHeight < 60; }}>
        {!active ? <p className="fil-vide">La causerie sera disponible sur le site en ligne.</p>
          : messages.length === 0 ? <p className="fil-vide">Aucun message pour le moment. Soyez le premier à dire « Paix » !</p>
          : messages.map((m) => (
            <div key={m.id} className={`bulle${m.pseudo === moi ? " moi" : ""}`}>
              <b>{m.pseudo}</b>
              <p>{m.texte}</p>
              <time dateTime={m.cree_le}>{heure(m.cree_le)}</time>
            </div>
          ))}
      </div>
      {ouverte && active ? (
        <form className="ecrire" onSubmit={envoyer}>
          <input className="pseudo" value={pseudo} onChange={(e) => setPseudo(e.target.value)} maxLength={30}
            placeholder="Votre prénom ou surnom" aria-label="Votre prénom ou surnom" autoComplete="nickname" suppressHydrationWarning />
          <div className="ligne-envoi">
            <textarea value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={500} rows={1}
              placeholder="Écrire un message…" aria-label="Message"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
            <button type="submit" disabled={envoi || !texte.trim()} aria-label="Envoyer">
              {envoi ? <Loader2 className="i tourne" aria-hidden /> : <Send className="i" aria-hidden />}
            </button>
          </div>
          {erreur && <p className="erreur" role="alert">{erreur}</p>}
        </form>
      ) : active && <p className="fil-vide">La causerie est fermée pour le moment.</p>}
    </div>
  );
}
