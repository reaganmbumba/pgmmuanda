/**
 * Vidéo de présentation de l'application (sans voix, avec légendes en français).
 * Données entièrement fictives, sur le Supabase local des tests (tests/e2e/supabase-local.sh).
 *
 *   APP=http://localhost:3000 SORTIE=dossier node scripts/video-tutoriel.mjs
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const APP = process.env.APP ?? "http://localhost:3000";
const SORTIE = process.env.SORTIE ?? ".e2e/video";
fs.mkdirSync(SORTIE, { recursive: true });
const env = Object.fromEntries(
  fs.readFileSync(".e2e/env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const MDP = "Exemple2026";

// --- Données fictives -------------------------------------------------------
async function compte(email, nom, role, identifiant) {
  const { data, error } = await admin.auth.admin.createUser({ email, password: MDP, email_confirm: true, user_metadata: { nom_affiche: nom } });
  if (error) throw error;
  await admin.from("profils").update({ role, nom_affiche: nom, identifiant }).eq("id", data.user.id);
}
await compte("admin@exemple.test", "Administrateur PGM", "super_admin", "admin");
const { data: paroisses } = await admin.from("paroisses").insert(
  ["Paroisse Atlantique", "Paroisse Pika Pende", "Paroisse Itonde", "Paroisse Kitsiaku"].map((nom) => ({ nom }))).select("id, nom");
const groupes = [["Vision", 0], ["Echo", 1], ["Alliance", 2], ["CHOPDI", 3], ["Oracle", null]];
const lignesChorales = groupes.flatMap(([g, i]) => ["Femme", "Homme", "Junior (Filles et Garçons)"]
  .map((t) => ({ nom: `${g} ${t}`, paroisse_id: i === null ? null : paroisses[i].id })));
const { data: chorales } = await admin.from("chorales").insert(lignesChorales).select("id, nom");
const vision = chorales.find((c) => c.nom === "Vision Femme");
const fictifs = [["Nsimba", "Esther", "soprano"], ["Makiese", "Rachel", "alto"], ["Lusamba", "Sarah", "soprano"], ["Kiala", "Naomie", "alto"]];
for (const [nom, prenom, voix] of fictifs) {
  await admin.from("membres").insert({ nom, prenom, voix, paroisse_id: paroisses[0].id, chorale_id: vision.id, statut: "actif", telephone: "+243810000000" });
}

// --- Enregistrement ---------------------------------------------------------
const TAILLE = { width: 1280, height: 720 };
const navigateur = await chromium.launch({ slowMo: 120 });
const LEGENDE = () => {
  const afficher = () => {
    if (!document.body) return;
    let d = document.getElementById("legende-video");
    if (!d) {
      d = document.createElement("div");
      d.id = "legende-video";
      d.style.cssText = "position:fixed;left:12px;right:12px;bottom:20px;margin:0 auto;width:fit-content;max-width:1100px;z-index:2147483647;"
        + "background:rgba(12,31,64,.94);color:#fff;font:600 clamp(15px,2vw,24px)/1.35 system-ui,sans-serif;padding:14px 26px;border-radius:16px;"
        + "box-shadow:0 8px 30px rgba(0,0,0,.35);text-align:center;pointer-events:none;border:2px solid #d4a72c";
      document.body.appendChild(d);
    }
    const [titre, texte] = (window.name || "").split("|");
    d.innerHTML = titre ? `<div style="color:#f2c94c;font-size:.7em;letter-spacing:.06em;text-transform:uppercase">${titre}</div>${texte}` : "";
    d.style.display = titre ? "block" : "none";
  };
  document.addEventListener("DOMContentLoaded", afficher);
  window.__legende = afficher;
};
async function ouvrir(nomVideo) {
  const ctx = await navigateur.newContext({ viewport: TAILLE, recordVideo: { dir: `${SORTIE}/${nomVideo}`, size: TAILLE }, locale: "fr-FR" });
  await ctx.addInitScript(LEGENDE);
  const p = await ctx.newPage();
  debuts.set(p, { video: nomVideo, t0: Date.now() });
  return { ctx, p };
}
const pause = (p, s) => p.waitForTimeout(s * 1000);

// Voix française (espeak-ng + mbrola fr4), synchronisée avec les légendes
const debuts = new Map();   // page -> heure du début de sa vidéo
const pistes = [];          // { video, debut, fichier }
let numero = 0;
function voix(texte) {
  const fichier = `${SORTIE}/voix-${String(++numero).padStart(2, "0")}.wav`;
  const parle = texte.replace(/[«»]/g, "").replace(/→/g, ", puis").replace(/\bPGM\b/g, "P G M");
  const r = spawnSync("espeak-ng", ["-v", "mb-fr4", "-s", "140", "-w", fichier, parle]);
  if (r.status !== 0) throw new Error(String(r.stderr));
  const wav = fs.readFileSync(fichier);
  return { fichier, duree: wav.readUInt32LE(40) / wav.readUInt32LE(28) };
}
async function dire(p, titre, texte, secondes = 4) {
  const { fichier, duree } = voix(texte);
  await p.evaluate(([t, x]) => { window.name = `${t}|${x}`; window.__legende?.(); }, [titre, texte]);
  pistes.push({ video: debuts.get(p).video, debut: (Date.now() - debuts.get(p).t0) / 1000, fichier });
  await pause(p, Math.max(secondes, duree + 0.7));
}
const aller = async (p, chemin) => { await p.goto(`${APP}${chemin}`); await p.waitForLoadState("networkidle"); };
const taper = (p, sel, texte) => p.locator(sel).first().pressSequentially(texte, { delay: 45 });
const defiler = async (p, px) => { await p.mouse.wheel(0, px); await pause(p, 1.2); };

// 1. Administration
const { ctx: ca, p: a } = await ouvrir("1-admin");
await aller(a, "/connexion");
await dire(a, "PGM Antenne de Muanda", "Bienvenue ! Voici comment utiliser l'application.", 4);
await dire(a, "1. Se connecter", "On écrit son identifiant et son mot de passe, puis on touche « Se connecter ».", 2);
await taper(a, "input[name=identifiant]", "admin");
await taper(a, "input[name=motDePasse]", MDP);
await a.click("button[type=submit]");
await a.waitForURL(/\/staff/);
await dire(a, "1. Se connecter", "L'administration arrive sur le tableau de bord : les chiffres de la PGM en un coup d'œil.", 5);

await aller(a, "/staff/paroisses");
await dire(a, "2. Paroisses et chorales", "Les paroisses et leurs chorales. Ici, on en ajoute ou on corrige un nom mal écrit.", 5);
await defiler(a, 500);
await dire(a, "2. Paroisses et chorales", "Oracle est une chorale « Urbain » : elle chante dans toutes les paroisses.", 4);

await aller(a, "/staff/membres/nouveau");
await dire(a, "3. Inscrire un membre", "Membres → Nouveau membre. On remplit la fiche du choriste.", 3);
await taper(a, "input[name=nom]", "Mbala");
await taper(a, "input[name=prenom]", "Ruth");
await a.selectOption("select[name=sexe]", "F");
await taper(a, "input[name=telephone]", "+243 81 234 5678");
await a.selectOption("select[name=paroisseId]", { label: "Paroisse Atlantique" });
await a.selectOption("select[name=choraleId]", { label: "Vision Femme" });
await a.selectOption("select[name=voix]", "soprano");
await dire(a, "3. Inscrire un membre", "Paroisse Atlantique, chorale Vision Femme, voix soprano. Puis « Inscrire le membre ».", 3);
await a.click("text=Inscrire le membre");
await a.waitForURL(/enregistre=1/);
const fiche = a.url().split("?")[0];
await dire(a, "3. Inscrire un membre", "Le matricule est donné automatiquement. On touche « Activer » quand le membre est validé.", 4);
await a.getByRole("button", { name: "Activer", exact: true }).first().click();
await pause(a, 1);
await a.getByRole("button", { name: "Confirmer" }).click();
await a.waitForSelector("text=Modification enregistrée.");
await dire(a, "3. Inscrire un membre", "Ruth Mbala est maintenant un membre actif.", 3);

await aller(a, "/staff/utilisateurs");
await dire(a, "4. Créer un compte", "Utilisateurs et permissions → Créer un compte, pour que Ruth se connecte.", 3);
await a.click("summary:has-text('Créer un compte')");
await taper(a, "details[open] input[name=nom]", "Ruth Mbala");
await dire(a, "4. Créer un compte", "L'identifiant et le mot de passe provisoire sont proposés automatiquement.", 4);
await a.click("button:has-text('Créer le compte')");
await a.waitForSelector("[data-mot-de-passe]");
await a.locator("[data-mot-de-passe]").scrollIntoViewIfNeeded();
await dire(a, "4. Créer un compte", "On envoie l'identifiant et le mot de passe à Ruth avec le bouton WhatsApp.", 5);
const identifiantRuth = (await admin.from("profils").select("identifiant").eq("nom_affiche", "Ruth Mbala").single()).data.identifiant;
const mdpRuth = (await a.textContent("[data-mot-de-passe]")).trim();

await a.goto(fiche);
await dire(a, "4. Créer un compte", "Sur la fiche de Ruth, on relie son compte : elle verra sa carte et ses présences.", 3);
await a.locator("select[name=profilId]").scrollIntoViewIfNeeded();
await a.selectOption("select[name=profilId]", { label: `Ruth Mbala (${identifiantRuth})` });
await a.click("text=Relier ce compte");
await a.waitForSelector("text=Modification enregistrée.");
await pause(a, 2);

await aller(a, "/staff/cartes");
await dire(a, "5. Cartes de membre", "Cartes et QR codes : un clic donne une carte à chaque membre actif.", 3);
await a.getByRole("button", { name: /Émettre les cartes manquantes/ }).first().click();
await pause(a, 1);
await a.getByRole("button", { name: "Confirmer" }).click();
await a.waitForSelector("text=/cartes? émises?/");
await dire(a, "5. Cartes de membre", "Les cartes s'impriment sur une feuille A4. Le QR code ne contient aucune information privée.", 5);

await aller(a, `/staff/registre?chorale=${vision.id}`);
await dire(a, "6. Registre de présence", "Chaque chorale a ses jours : lundi et jeudi répétition, dimanche culte.", 5);
await dire(a, "6. Registre de présence", "On choisit la date (même un jour inhabituel), puis « Ouvrir le registre ».", 3);
await a.click("button:has-text('Ouvrir le registre')");
await a.waitForURL(/\/staff\/registre\/[0-9a-f-]{36}$/);
await dire(a, "6. Registre de présence", "Pour chaque membre : Présent, Absent ou Excusé.", 2);
const statuts = { "PGM-MUA-0001": "Présent", "PGM-MUA-0002": "Présent", "PGM-MUA-0003": "Excusé", "PGM-MUA-0004": "Présent", "PGM-MUA-0005": "Absent" };
for (const [matricule, statut] of Object.entries(statuts)) {
  await a.locator(`tr[data-membre='${matricule}'] button[role=radio]:has-text('${statut}')`).click();
  await pause(a, 0.5);
}
await dire(a, "6. Registre de présence", "Ruth est absente aujourd'hui. On touche « Enregistrer ».", 3);
await a.click("button:has-text('Enregistrer la feuille de présence')");
await a.waitForSelector("text=Feuille de présence enregistrée");
await pause(a, 2);

await aller(a, "/staff/cotisations");
await dire(a, "7. Cotisations", "Cotisations du mois : qui a payé, qui est en retard.", 4);
const ligne = a.locator("[data-cotisation^='Esther Nsimba']");
await ligne.locator("input[name=montant]").fill("");
await ligne.locator("input[name=montant]").pressSequentially("2000", { delay: 80 });
await dire(a, "7. Cotisations", "Quand un membre paie, on écrit le montant et on touche « Payé ».", 2);
await ligne.locator("button:has-text('Payé')").click();
await a.waitForFunction(() => document.querySelector("[data-nb-payes]")?.textContent.trim() === "1");
await dire(a, "7. Cotisations", "Pour un retard, « Rappeler » ouvre WhatsApp avec un message déjà écrit.", 5);
await ca.close();

// 2. Espace du choriste (sur téléphone)
const ctxC = await navigateur.newContext({ viewport: { width: 400, height: 720 }, recordVideo: { dir: `${SORTIE}/2-choriste`, size: { width: 400, height: 720 } }, locale: "fr-FR", isMobile: true, hasTouch: true });
await ctxC.addInitScript(LEGENDE);
const c = await ctxC.newPage();
debuts.set(c, { video: "2-choriste", t0: Date.now() });
await aller(c, "/connexion");
await dire(c, "8. Espace du choriste", "Ruth se connecte sur son téléphone.", 2);
await taper(c, "input[name=identifiant]", identifiantRuth);
await taper(c, "input[name=motDePasse]", mdpRuth);
await c.click("button[type=submit]");
await c.waitForURL(/\/choriste/);
await dire(c, "8. Espace du choriste", "Son accueil : sa fiche et son programme.", 4);
await aller(c, "/choriste/carte");
await dire(c, "8. Espace du choriste", "Sa carte de choriste, à montrer.", 4);
await aller(c, "/choriste/presences");
await dire(c, "8. Espace du choriste", "Mes présences : elle voit le jour de son absence.", 3);
await c.locator("[data-mes-absences]").scrollIntoViewIfNeeded();
await pause(c, 4);
await dire(c, "Fin", "Le tutoriel écrit complet est dans le projet. Bonne utilisation !", 4);
await ctxC.close();
await navigateur.close();
fs.writeFileSync(`${SORTIE}/pistes.json`, JSON.stringify(pistes, null, 1));
console.log(`Vidéos dans ${SORTIE}`);
