/**
 * Parcours de bout en bout : application Next.js + Supabase local (tests/e2e/supabase-local.sh).
 * Chaque étape est vérifiée dans le navigateur ; le script s'arrête à la première erreur.
 *
 *   APP=http://localhost:3000 node tests/e2e/parcours.mjs
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";

const APP = process.env.APP ?? "http://localhost:3000";
const env = Object.fromEntries(
  fs.readFileSync(".e2e/env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const MDP = "MotDePasse2026";

let n = 0;
function ok(condition, message) {
  if (!condition) throw new Error(`ÉCHEC : ${message}`);
  console.log(`  ✓ ${++n}. ${message}`);
}

async function creerCompte(email, nom, role, champs = {}) {
  const { data, error } = await admin.auth.admin.createUser({ email, password: MDP, email_confirm: true, user_metadata: { nom_affiche: nom } });
  if (error) throw error;
  const { error: e2 } = await admin.from("profils").update({ role, nom_affiche: nom, ...champs }).eq("id", data.user.id);
  if (e2) throw e2;
  return data.user.id;
}

const navigateur = await chromium.launch();
const erreursPage = [];
const pages = [];
async function session(identifiant) {
  const ctx = await navigateur.newContext({ acceptDownloads: true });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreursPage.push(e.message));
  pages.push(p);
  await p.goto(`${APP}/connexion`);
  await p.fill("input[name=identifiant]", identifiant);
  await p.fill("input[name=motDePasse]", MDP);
  await p.click("button[type=submit]");
  await p.waitForURL((u) => !u.pathname.startsWith("/connexion"), { timeout: 15000 });
  return p;
}
const texte = async (p) => (await p.textContent("main")) ?? "";
const confirmer = async (p, libelle) => {
  await p.getByRole("button", { name: libelle, exact: true }).first().click();
  await p.getByRole("button", { name: "Confirmer" }).click();
};

try {
  // --- Comptes de test ---------------------------------------------------
  await creerCompte("admin@e2e.test", "Admin E2E", "super_admin", { identifiant: "admin.e2e" });

  // --- Administration : paroisses et chorales ----------------------------
  console.log("Administration");
  const a = await session("admin.e2e");
  ok(new URL(a.url()).pathname === "/staff", "le super administrateur arrive dans l'espace staff");

  await a.goto(`${APP}/staff/membres`);
  ok((await texte(a)).includes("Aucun membre enregistré"), "liste des membres vide au départ");

  await a.goto(`${APP}/staff/paroisses`);
  for (const nom of ["Paroisse Alpha", "Paroisse Beta"]) {
    await a.fill("input[name=nom] >> nth=0", nom);
    await a.click("text=Ajouter >> nth=0");
    await a.waitForSelector(`text=Paroisse « ${nom} » ajoutée.`);
  }
  ok((await texte(a)).includes("Paroisse Beta"), "deux paroisses créées");
  await a.selectOption("select[name=paroisseId]", { label: "Paroisse Alpha" });
  await a.fill("form:has(select[name=paroisseId]) input[name=nom]", "Chorale Alpha");
  await a.click("form:has(select[name=paroisseId]) button[type=submit]");
  await a.waitForSelector("text=Chorale « Chorale Alpha » ajoutée.");
  ok(true, "chorale ajoutée à la paroisse Alpha");

  const { data: par } = await admin.from("paroisses").select("id, nom");
  const idBeta = par.find((p) => p.nom === "Paroisse Beta").id;

  // --- Inscription des membres --------------------------------------------
  console.log("Membres");
  async function inscrire(m) {
    await a.goto(`${APP}/staff/membres/nouveau`);
    await a.fill("input[name=nom]", m.nom);
    await a.fill("input[name=prenom]", m.prenom);
    if (m.telephone) await a.fill("input[name=telephone]", m.telephone);
    await a.selectOption("select[name=paroisseId]", { label: m.paroisse });
    if (m.chorale) await a.selectOption("select[name=choraleId]", { label: m.chorale });
    await a.click("text=Inscrire le membre");
  }
  await inscrire({ nom: "Testa", prenom: "Bad", telephone: "abc", paroisse: "Paroisse Alpha" });
  await a.waitForSelector("p[role=alert]");
  ok((await a.textContent("p[role=alert]")).includes("Téléphone"), "un téléphone invalide est refusé avec un message clair");

  await inscrire({ nom: "Mavungu", prenom: "Grace", telephone: "+243 81 111 1111", paroisse: "Paroisse Alpha", chorale: "Chorale Alpha" });
  await a.waitForURL(/\/staff\/membres\/[0-9a-f-]{36}\?enregistre=1/);
  ok((await texte(a)).includes("PGM-MUA-0001"), "premier membre : matricule PGM-MUA-0001 attribué automatiquement");
  const fiche1 = a.url().split("?")[0];

  await inscrire({ nom: "Lukombo", prenom: "Paul", paroisse: "Paroisse Beta" });
  await a.waitForURL(/enregistre=1/);
  ok((await texte(a)).includes("PGM-MUA-0002"), "deuxième membre : PGM-MUA-0002");
  const fiche2 = a.url().split("?")[0];

  // Modification + historique
  await a.goto(`${fiche1}/modifier`);
  ok((await texte(a)).includes("non modifiable"), "le matricule est indiqué comme non modifiable");
  await a.selectOption("select[name=voix]", "tenor");
  await a.click("text=Enregistrer les modifications");
  await a.waitForURL(/enregistre=1/);
  let t = await texte(a);
  ok(t.includes("Ténor") && t.includes("Modification") && t.includes("Voix"), "la modification de la voix apparaît dans l'historique");
  ok(t.includes("Admin E2E"), "l'historique indique l'auteur de la modification");

  // Statut avec confirmation
  await confirmer(a, "Activer");
  await a.waitForSelector("text=Modification enregistrée.");
  await a.reload();
  t = await texte(a);
  ok(t.includes("Changement de statut") && t.includes("Actif"), "activation confirmée puis historisée");

  // --- Compte choriste relié à la fiche ----------------------------------
  console.log("Espace choriste");
  await creerCompte("grace@e2e.test", "Grace Mavungu", "choriste", { identifiant: "grace" });
  await a.goto(fiche1);
  await a.selectOption("select[name=profilId]", { label: "Grace Mavungu (grace)" });
  await a.click("text=Relier ce compte");
  await a.waitForSelector("text=Modification enregistrée.");
  ok(true, "compte choriste relié à la fiche par l'administrateur");

  const c = await session("grace");
  ok(new URL(c.url()).pathname === "/choriste", "le choriste arrive dans son espace");
  await c.goto(`${APP}/choriste/profil`);
  t = await texte(c);
  ok(t.includes("PGM-MUA-0001") && t.includes("Chorale Alpha"), "le choriste voit sa propre fiche");
  await c.click("text=Demander une correction");
  await c.selectOption("select[name=champ]", "telephone");
  await c.fill("input[name=valeur]", "+243 99 222 3333");
  await c.fill("textarea[name=motif]", "Nouveau numéro");
  await c.click("text=Envoyer la demande");
  await c.waitForSelector("text=Demande envoyée.");
  ok(true, "le choriste envoie une demande de correction");
  await c.goto(`${APP}/staff/membres`);
  ok(new URL(c.url()).pathname !== "/staff/membres", "le choriste ne peut pas ouvrir la liste des membres");
  const { data: vus } = await createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    .auth.signInWithPassword({ email: "grace@e2e.test", password: MDP })
    .then(async ({ data }) => {
      const cl = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
      });
      return cl.from("membres").select("matricule");
    });
  ok(vus.length === 1 && vus[0].matricule === "PGM-MUA-0001", "même par l'API, le choriste ne lit que sa propre fiche");

  // --- Traitement de la demande -------------------------------------------
  console.log("Demandes de correction");
  await a.goto(`${APP}/staff/membres`);
  ok((await texte(a)).includes("1 demande de correction en attente"), "la demande apparaît dans la liste du staff");
  await a.goto(fiche1);
  await confirmer(a, "Accepter");
  await a.waitForSelector("text=La fiche a été mise à jour.");
  await a.reload();
  t = await texte(a);
  ok(t.includes("+243 99 222 3333") && t.includes("Acceptée"), "correction acceptée et appliquée à la fiche");
  await c.goto(`${APP}/choriste/profil`);
  ok((await texte(c)).includes("+243 99 222 3333"), "le choriste voit la correction appliquée");

  // --- Responsable de paroisse : périmètre limité -------------------------
  console.log("Responsable de paroisse");
  await creerCompte("beta@e2e.test", "Resp Beta", "responsable_paroisse", { identifiant: "resp.beta", paroisse_id: idBeta });
  const r = await session("resp.beta");
  await r.goto(`${APP}/staff/membres`);
  t = await texte(r);
  ok(t.includes("PGM-MUA-0002") && !t.includes("PGM-MUA-0001"), "le responsable ne voit que les membres de sa paroisse");
  let rep = await r.goto(fiche1);
  ok(rep.status() === 404, "la fiche d'une autre paroisse est introuvable pour lui");
  await r.goto(`${APP}/staff/membres/nouveau`);
  const options = await r.$$eval("select[name=paroisseId] option", (o) => o.map((x) => x.textContent));
  ok(!options.includes("Paroisse Alpha") && options.includes("Paroisse Beta"), "il ne peut inscrire que dans sa paroisse");
  await r.goto(`${APP}/staff/utilisateurs`);
  ok(new URL(r.url()).pathname !== "/staff/utilisateurs", "il n'a pas accès à la gestion des utilisateurs");


  // --- Cartes et QR codes --------------------------------------------------
  console.log("Cartes et QR codes");
  await a.goto(fiche1);
  await a.setInputFiles("input[type=file][aria-label='Photo du membre']", "tests/e2e/photo-test.jpg");
  await a.waitForSelector("text=Photo enregistrée.");
  await a.reload();
  ok((await a.locator("section img[src^='data:image/jpeg']").count()) > 0, "photo réduite dans le navigateur puis enregistrée");

  await a.click("text=Émettre la carte");
  await a.waitForSelector("text=Carte émise.");
  await a.reload();
  const lien1 = await a.locator("svg[data-qr]").first().getAttribute("data-qr");
  ok(/^http:\/\/localhost:3000\/verifier\/[A-Za-z0-9_-]{22}$/.test(lien1), "le QR contient uniquement le lien de vérification avec une référence aléatoire");
  ok(!lien1.includes("PGM-MUA") && !lien1.includes("Mavungu"), "aucune donnée personnelle dans le QR");

  const lienPdf = await a.locator("a[href$='/pdf']").first().getAttribute("href");
  rep = await a.request.get(`${APP}${lienPdf}`);
  const pdf = await PDFDocument.load(await rep.body());
  ok(rep.headers()["content-type"] === "application/pdf" && pdf.getPageCount() === 2, "la carte PDF (recto et verso) se télécharge");
  const anonyme = await navigateur.newContext();
  rep = await anonyme.request.get(`${APP}${lienPdf}`);
  ok(rep.status() === 401, "le PDF n'est pas accessible sans connexion");
  rep = await r.request.get(`${APP}${lienPdf}`);
  ok(rep.status() === 404, "un responsable d'une autre paroisse ne peut pas télécharger cette carte");

  const visiteur = await anonyme.newPage();
  visiteur.on("pageerror", (e) => erreursPage.push(e.message));
  await visiteur.goto(lien1);
  t = (await visiteur.textContent("body")) ?? "";
  ok(t.includes("Carte valide") && t.includes("Grace Mavungu") && t.includes("PGM-MUA-0001"), "la page publique confirme la carte valide");
  // Contrôle sur tout le code HTML reçu, scripts compris, et pas seulement le texte affiché
  const html = await visiteur.content();
  ok(!html.includes("+243 99 222 3333") && !html.includes("grace@e2e.test") && !html.includes("Ténor") && !html.includes("Chorale Alpha"),
    "la page publique ne transmet ni téléphone, ni e-mail, ni autre donnée privée");
  ok((await visiteur.locator("img[src^='data:image/jpeg']").count()) === 1, "la page publique montre la photo pour comparer avec le porteur");

  await c.goto(`${APP}/choriste/qr`);
  ok((await c.locator("svg[data-qr]").getAttribute("data-qr")) === lien1, "le choriste voit le même QR dans son espace");
  await c.goto(`${APP}/choriste/carte`);
  rep = await c.request.get(`${APP}${await c.locator("a[href$='/pdf']").getAttribute("href")}`);
  ok(rep.ok() && rep.headers()["content-type"] === "application/pdf", "le choriste télécharge sa propre carte en PDF");

  await a.goto(`${APP}/staff/scanner`);
  await a.fill("#matricule", "PGM-MUA-0001");
  await a.click("form:has(#matricule) button[type=submit]");
  await a.waitForSelector("text=Carte valide");
  ok(true, "le scanner vérifie une carte par matricule");

  // Lecture par caméra : une webcam simulée filme le QR code de la carte
  await creerCompte("controle@e2e.test", "Contrôleur E2E", "controleur", { identifiant: "controleur.e2e" });
  await QRCode.toFile(".e2e/qr.png", lien1, { width: 480, margin: 6 });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-loop", "1", "-i", ".e2e/qr.png", "-vf", "pad=640:480:(ow-iw)/2:(oh-ih)/2:white,format=yuv420p", "-t", "2", "-r", "10", ".e2e/qr.y4m"]);
  const camera = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-file-for-fake-video-capture=.e2e/qr.y4m"] });
  try {
    const ctx = await camera.newContext({ permissions: ["camera"] });
    const k = await ctx.newPage();
    await k.goto(`${APP}/connexion`);
    await k.fill("input[name=identifiant]", "controleur.e2e");
    await k.fill("input[name=motDePasse]", MDP);
    await k.click("button[type=submit]");
    await k.waitForURL(/\/staff\/scanner/);
    ok(true, "le contrôleur arrive directement sur le scanner");
    for (const interdit of ["/staff", "/staff/membres", "/staff/cartes"]) {
      await k.goto(`${APP}${interdit}`);
      if (new URL(k.url()).pathname !== "/staff/scanner") throw new Error(`ÉCHEC : le contrôleur a ouvert ${interdit}`);
    }
    ok(true, "le contrôleur n'ouvre ni le tableau de bord, ni les membres, ni les cartes");
    await k.click("text=Activer la caméra");
    await k.waitForSelector("text=Carte valide", { timeout: 20000 });
    ok((await k.textContent("main")).includes("PGM-MUA-0001"), "le contrôleur scanne la carte avec la caméra");
  } finally {
    await camera.close();
  }

  await a.goto(fiche1);
  await confirmer(a, "Rééditer");
  await a.waitForSelector("text=Nouvelle carte émise");
  await a.reload();
  const lien2 = await a.locator("svg[data-qr]").first().getAttribute("data-qr");
  ok(lien2 !== lien1, "la réédition donne une nouvelle référence");
  await visiteur.goto(lien1);
  ok(((await visiteur.textContent("body")) ?? "").includes("Carte révoquée"), "l'ancienne carte est signalée comme révoquée");
  await visiteur.goto(lien2);
  ok(((await visiteur.textContent("body")) ?? "").includes("Carte valide"), "la nouvelle carte est valide");

  await a.getByRole("button", { name: "Révoquer", exact: true }).click();
  await a.selectOption("select[name=motif]", "Vol");
  await a.getByRole("button", { name: "Confirmer" }).click();
  await a.waitForSelector("text=Carte révoquée.");
  await visiteur.goto(lien2);
  ok(((await visiteur.textContent("body")) ?? "").includes("Carte révoquée"), "une carte révoquée n'est plus valable");
  await a.reload();
  t = await texte(a);
  ok(t.includes("Carte de membre") && t.includes("Vol"), "les opérations sur les cartes figurent dans l'historique avec leur motif");
  await visiteur.goto(`${APP}/verifier/inexistante-0123456789`);
  ok(((await visiteur.textContent("body")) ?? "").includes("Référence inconnue"), "une référence inventée est signalée comme inconnue");

  await a.goto(`${APP}/staff/cartes`);
  await confirmer(a, "Émettre les cartes manquantes (1)");
  await a.waitForSelector("text=1 carte émise.");
  rep = await a.request.get(`${APP}/staff/cartes/impression`);
  ok(rep.ok() && (await PDFDocument.load(await rep.body())).getPageCount() === 1, "les cartes manquantes sont émises puis imprimées sur une planche A4");
  await a.goto(`${APP}/staff/scanner`);
  ok((await texte(a)).includes("Derniers contrôles") && (await a.locator("text=Révoquée").count()) > 0, "les contrôles sont enregistrés et consultables");
  await anonyme.close();

  // --- Export, archivage, suppression protégée ---------------------------
  console.log("Export et archives");
  const [telechargement] = await Promise.all([a.waitForEvent("download"), a.goto(`${APP}/staff/membres`).then(() => a.click("text=Exporter (Excel)"))]);
  const csv = fs.readFileSync(await telechargement.path(), "utf8");
  ok(csv.startsWith("﻿Matricule;") && csv.includes("PGM-MUA-0001;Mavungu") && csv.includes("PGM-MUA-0002"), "export CSV lisible par Excel");

  await a.goto(fiche2);
  await confirmer(a, "Archiver");
  await a.waitForSelector("text=Membre archivé.");
  await a.goto(`${APP}/staff/membres`);
  t = await texte(a);
  ok(!t.includes("PGM-MUA-0002"), "le membre archivé disparaît de la liste");
  await a.goto(`${APP}/staff/membres?vue=archives`);
  ok((await texte(a)).includes("PGM-MUA-0002"), "il reste consultable dans les archives");

  await a.goto(`${APP}/staff/paroisses`);
  await a.locator("section", { hasText: "Paroisse Alpha" }).getByRole("button", { name: "Supprimer" }).click();
  await a.getByRole("button", { name: "Confirmer" }).click();
  await a.waitForSelector("text=Impossible : des membres ou des chorales sont rattachés");
  ok(true, "une paroisse qui a des membres ne peut pas être supprimée");

  const { data: m3 } = await admin.from("membres").update({ matricule: "PGM-MUA-9999" }).eq("matricule", "PGM-MUA-0001").select();
  ok(m3 === null, "le matricule reste immuable, même avec la clé serveur");

  ok(erreursPage.length === 0, `aucune erreur JavaScript dans les pages${erreursPage.length ? " : " + erreursPage.join(" | ") : ""}`);
  console.log(`\nParcours réussi : ${n} vérifications.`);
} catch (e) {
  console.error(`\n${e.message}`);
  process.exitCode = 1;
  // Captures d'écran pour comprendre l'échec
  for (const [i, p] of pages.entries()) {
    console.error(`  page ${i} : ${p.url()}`);
    await p.screenshot({ path: `.e2e/echec-${i}.png`, fullPage: true }).catch(() => {});
  }
} finally {
  await navigateur.close();
}
