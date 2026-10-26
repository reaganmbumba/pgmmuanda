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
/** Captures d'écran facultatives (CAPTURES=dossier) pour la documentation. */
async function capture(p, nom, chemin, mobile = false) {
  if (!process.env.CAPTURES) return;
  const taille = p.viewportSize();
  if (mobile) await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(`${APP}${chemin}`);
  await p.screenshot({ path: `${process.env.CAPTURES}/${nom}.png`, fullPage: true });
  if (mobile) await p.setViewportSize(taille);
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

  // --- Tableau de bord et recherche rapide --------------------------------
  console.log("Tableau de bord");
  await a.goto(`${APP}/staff`);
  const indicateur = async (p, libelle) => (await p.textContent(`[data-indicateur="${libelle}"] p`))?.trim();
  ok(await indicateur(a, "Choristes inscrits") === "2" && await indicateur(a, "Membres actifs") === "1"
    && await indicateur(a, "En attente de validation") === "1" && await indicateur(a, "Cartes actives") === "0",
    "le tableau de bord affiche les vrais chiffres (2 inscrits, 1 actif, 1 en attente, 0 carte)");
  t = await texte(a);
  ok(t.includes("Paul Lukombo") && t.includes("Paroisse Beta") && !t.includes("Nkanga") && await indicateur(a, "Taux de présence (30 j)") === "—",
    "membres en attente réels, sans données de démonstration");
  ok((await a.locator("text=Mode maquette").count()) === 0, "aucun bandeau de démonstration en mode réel");
  await a.fill("input[name=q]", "mavúngu");
  await a.press("input[name=q]", "Enter");
  await a.waitForURL(/\/staff\/membres\?q=/);
  t = await texte(a);
  ok(t.includes("PGM-MUA-0001") && !t.includes("PGM-MUA-0002"), "la recherche rapide trouve le membre, sans tenir compte des accents");

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
  t = await texte(c);
  ok(t.includes("Grace Mavungu") && t.includes("PGM-MUA-0001") && t.includes("Ténor") && t.includes("Aucune") && !t.includes("Nkanga"),
    "l'accueil du choriste affiche sa propre fiche (nom, matricule, voix, pas encore de carte)");
  ok((await c.locator("[data-non-lues]").count()) === 0, "aucune notification non lue au départ");
  await c.goto(`${APP}/choriste/paroisse`);
  t = await texte(c);
  ok(t.includes("Paroisse Alpha") && t.includes("Chorale Alpha") && !t.includes("Paroisse Beta"), "la page « Ma paroisse » montre sa paroisse et sa chorale");
  await c.goto(`${APP}/choriste/programme`);
  t = await texte(c);
  ok(t.includes("Aucune activité prévue pour vous") && !t.includes("quatre voix"), "le programme n'affiche pas de fausses activités en mode réel");
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
  await a.goto(`${APP}/staff`);
  ok((await a.locator("button[aria-label='Notifications (1 non lues)']").count()) === 1, "l'administrateur reçoit une notification pour la demande");
  ok((await texte(a)).includes("Demandes de correction en attente") && (await texte(a)).includes("Grace Mavungu"), "la demande figure sur le tableau de bord");
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
  ok((await c.textContent("[data-non-lues]"))?.trim() === "1", "le choriste a une notification non lue");
  await c.goto(`${APP}/choriste/notifications`);
  ok((await texte(c)).includes("Votre demande de correction a été acceptée"), "la notification annonce que sa demande est acceptée");

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
  ok((await r.locator("button[aria-label^='Notifications (']").count()) === 0, "il ne reçoit pas les notifications d'une autre paroisse");
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
  await c.goto(`${APP}/choriste/notifications`);
  await c.getByRole("button", { name: /Votre carte de choriste est disponible/ }).click();
  await c.waitForURL(/\/choriste\/carte$/);
  await c.goto(`${APP}/choriste`);
  t = await texte(c);
  ok(t.includes("Valide") && (await c.textContent("[data-non-lues]"))?.trim() === "1",
    "la notification de carte ouvre la carte et passe en lue ; l'accueil indique une carte valide");
  await c.goto(`${APP}/choriste/notifications`);
  await c.click("text=Tout marquer comme lu");
  await c.waitForSelector("[data-non-lues]", { state: "detached" });
  ok(true, "« Tout marquer comme lu » vide le compteur");

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

  // --- Programmes, présences et annonces ---------------------------------
  console.log("Programmes, présences et annonces");
  // Heure de Muanda (UTC+1) : « il y a une heure » à Muanda correspond à l'heure UTC actuelle.
  const ilYaUneHeure = new Date().toISOString().slice(0, 16);
  const demain = new Date(Date.now() + 25 * 3600_000).toISOString().slice(0, 16);
  async function creerActivite(p, { titre, debut, lieu = "", voix }) {
    await p.goto(`${APP}/staff/programmes/nouvelle`);
    await p.fill("input[name=titre]", titre);
    await p.fill("input[name=debut]", debut);
    if (lieu) await p.fill("input[name=lieu]", lieu);
    if (voix) {
      await p.check("input[name=ciblage][value=cibles]");
      await p.check(`input[name=cibleVoix][value=${voix}]`);
    }
    await p.click("text=Créer l'activité");
    await p.waitForURL(/\/staff\/programmes\/[0-9a-f-]{36}\?enregistre=1/);
    return p.url().split("?")[0];
  }
  const repetition = await creerActivite(a, { titre: "Répétition générale", debut: ilYaUneHeure, lieu: "Temple central" });
  ok((await texte(a)).includes("Toute la PGM · Tous les membres"), "l'administration crée une activité pour toute la PGM");
  await creerActivite(a, { titre: "Répétition des basses", debut: demain, voix: "basse" });
  ok(true, "et une activité réservée à une voix");
  const activiteBeta = await creerActivite(r, { titre: "Réunion paroisse Beta", debut: demain });
  ok((await texte(r)).includes("Paroisse Beta · Tous les membres"), "le responsable crée une activité limitée à sa paroisse");
  await r.goto(repetition);
  ok((await r.locator("text=Modifier").count()) === 0, "il ne peut pas modifier une activité de toute la PGM");
  t = await texte(r);
  ok(t.includes("PGM-MUA-0002") && !t.includes("PGM-MUA-0001"), "sur sa feuille de présence, il ne voit que les membres de sa paroisse");

  await c.goto(`${APP}/choriste/programme`);
  t = await texte(c);
  ok(t.includes("Répétition générale") && !t.includes("Répétition des basses") && !t.includes("Réunion paroisse Beta"),
    "le choriste ne voit que les activités qui le concernent");
  await c.goto(`${APP}/choriste/notifications`);
  t = await texte(c);
  ok(t.includes("Nouvelle activité : Répétition générale") && !t.includes("basses"), "il est notifié des activités qui le concernent seulement");

  // Pointage par caméra (contrôleur), puis par matricule (administration)
  await a.goto(fiche1);
  const lienCarte = await a.locator("svg[data-qr]").first().getAttribute("data-qr");
  await QRCode.toFile(".e2e/qr2.png", lienCarte, { width: 480, margin: 6 });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-loop", "1", "-i", ".e2e/qr2.png", "-vf", "pad=640:480:(ow-iw)/2:(oh-ih)/2:white,format=yuv420p", "-t", "2", "-r", "10", ".e2e/qr2.y4m"]);
  const camera2 = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-file-for-fake-video-capture=.e2e/qr2.y4m"] });
  try {
    const k = await (await camera2.newContext({ permissions: ["camera"] })).newPage();
    k.on("pageerror", (e) => erreursPage.push(e.message));
    await k.goto(`${APP}/connexion`);
    await k.fill("input[name=identifiant]", "controleur.e2e");
    await k.fill("input[name=motDePasse]", MDP);
    await k.click("button[type=submit]");
    await k.waitForURL(/\/staff\/scanner/);
    await k.goto(`${APP}/staff/presences`);
    await k.click("text=Répétition générale");
    await k.click("text=Activer la caméra");
    await k.waitForSelector("[data-resultat=enregistre]", { timeout: 20000 });
    ok((await k.textContent("[data-resultat]")).includes("PGM-MUA-0001"), "le contrôleur pointe la présence en scannant la carte");
    await k.goto(`${APP}/staff/programmes`);
    ok(new URL(k.url()).pathname === "/staff/scanner", "mais il n'ouvre pas la gestion du programme");
  } finally {
    await camera2.close();
  }
  await a.goto(`${APP}/staff/presences?activite=${repetition.split("/").pop()}`);
  await a.fill("#matricule-presence", "PGM-MUA-0001");
  await a.getByRole("button", { name: "Pointer", exact: true }).click();
  await a.waitForSelector("[data-resultat=deja_present]");
  ok(true, "un second pointage est signalé « déjà pointé »");

  await a.goto(repetition);
  ok((await a.locator("tr[data-membre='PGM-MUA-0001']").textContent()).includes("par QR"), "la feuille de présence indique le pointage par QR");
  await a.locator("tr[data-membre='PGM-MUA-0002']").getByRole("radio", { name: "Absent" }).click();
  await a.click("text=Enregistrer la feuille de présence");
  await a.waitForSelector("text=Feuille de présence enregistrée (1 modification).");
  await a.reload();
  const compte = async (s) => (await a.textContent(`[data-compte=${s}] p:last-child`))?.trim();
  ok(await compte("present") === "1" && await compte("absent") === "1" && (await texte(a)).includes("50 %"),
    "la feuille de présence est enregistrée : 1 présent, 1 absent, 50 %");
  await c.goto(`${APP}/choriste/presences`);
  t = await texte(c);
  ok((await c.textContent("[data-taux]")).trim() === "100 %" && t.includes("Répétition générale") && t.includes("Présent"),
    "le choriste voit sa présence et son taux");

  // Modification et annulation
  await a.goto(`${repetition}/modifier`);
  await a.fill("input[name=lieu]", "Salle de la PGM");
  await a.click("text=Enregistrer les modifications");
  await a.waitForURL(/enregistre=1/);
  await r.goto(activiteBeta);
  await confirmer(r, "Annuler l'activité");
  await r.waitForSelector("text=Activité annulée.");
  ok(true, "le responsable annule l'activité de sa paroisse");
  await c.goto(`${APP}/choriste/notifications`);
  t = await texte(c);
  ok(t.includes("Activité modifiée : Répétition générale") && t.includes("Salle de la PGM") && !t.includes("Beta"),
    "le choriste est prévenu du changement de lieu, pas de l'annulation qui ne le concerne pas");

  // Annonces
  await a.goto(`${APP}/staff/communication/nouvelle`);
  await a.fill("input[name=titre]", "Tenue blanche dimanche");
  await a.selectOption("select[name=type]", "urgente");
  await a.fill("textarea[name=contenu]", "Toute la chorale Alpha en blanc pour le culte.");
  await a.check("input[name=ciblage][value=cibles]");
  await a.getByLabel("Chorale Alpha (Paroisse Alpha)").check();
  await a.click("text=Publier l'annonce");
  await a.waitForURL(/publiee=1/);
  ok((await a.locator("[data-annonce='Tenue blanche dimanche'] a[href^='https://wa.me/?text=']").count()) === 1,
    "l'annonce est publiée, avec un lien de partage WhatsApp à envoyer soi-même");
  await r.goto(`${APP}/staff/communication/nouvelle`);
  ok((await r.$$eval("select[name=portee] option", (o) => o.map((x) => x.textContent))).join() === "Paroisse Beta",
    "le responsable ne peut publier que pour sa paroisse");
  await r.fill("input[name=titre]", "Réunion des choristes Beta");
  await r.fill("textarea[name=contenu]", "Samedi à 10 h.");
  await r.click("text=Publier l'annonce");
  await r.waitForURL(/publiee=1/);
  await c.goto(`${APP}/choriste/annonces`);
  t = await texte(c);
  ok(t.includes("Tenue blanche dimanche") && t.includes("Urgente") && !t.includes("Réunion des choristes Beta"),
    "le choriste lit l'annonce qui le concerne, pas celle d'une autre paroisse");
  await c.goto(`${APP}/choriste/notifications`);
  ok((await texte(c)).includes("Urgent : Tenue blanche dimanche"), "il reçoit une notification « Urgent »");
  await c.goto(`${APP}/choriste`);
  t = await texte(c);
  ok(t.includes("Prochaine activité") && t.includes("Répétition générale") && t.includes("Tenue blanche dimanche"),
    "l'accueil du choriste montre sa prochaine activité et ses annonces");

  // Tableau de bord et rapports
  await a.goto(`${APP}/staff`);
  ok(await indicateur(a, "Taux de présence (30 j)") === "50 %" && (await texte(a)).includes("Répétition générale"),
    "le tableau de bord affiche le taux de présence et les activités à venir");
  await a.goto(`${APP}/staff/rapports`);
  ok((await a.textContent("[data-indicateur='Taux de présence'] p:last-child")).trim() === "50 %", "le rapport calcule le taux de présence");
  rep = await a.request.get(`${APP}/staff/rapports/presences?jours=30`);
  const csvPresences = await rep.text();
  ok(rep.ok() && csvPresences.includes("Répétition générale;PGM-MUA-0001;Mavungu;Grace;Paroisse Alpha;Présent;QR code"),
    "les présences s'exportent pour Excel");
  rep = await r.request.get(`${APP}/staff/rapports/presences?jours=30`);
  ok(!(await rep.text()).includes("PGM-MUA-0001"), "l'export du responsable ne contient que sa paroisse");

  // --- Étape 7 : commissions, formations, projets, finances, hébergement, chants ---
  console.log("Commissions, formations, projets, finances, hébergement, chants");
  const ouvrir = async (p, titre) => {
    const d = p.locator("details", { has: p.locator("summary", { hasText: titre }) }).first();
    await d.locator("summary").first().click();
    return d;
  };
  const choisir = async (zone, nom, contient) => {
    const sel = zone.locator(`select[name=${nom}]`);
    await sel.selectOption(await sel.locator("option", { hasText: contient }).first().getAttribute("value"));
  };
  const jourDans = (j) => new Date(Date.now() + j * 86400_000).toISOString().slice(0, 10);

  await a.goto(`${APP}/staff/commissions`);
  let z = await ouvrir(a, "Créer une commission");
  await z.locator("input[name=nom]").fill("Commission artistique");
  await z.locator("input[name=description]").fill("Répertoire et répétitions");
  await z.locator("button[type=submit]").click();
  await a.waitForSelector("text=Commission « Commission artistique » créée.");
  ok(true, "l'administration crée une commission");
  const { data: coms } = await admin.from("commissions").select("id").eq("nom", "Commission artistique");
  await creerCompte("resp.art@e2e.test", "Resp Artistique", "responsable_commission", { identifiant: "resp.art", commission_id: coms[0].id });
  const rc = await session("resp.art");
  await rc.goto(`${APP}/staff/commissions`);
  await rc.click("[data-commission='Commission artistique'] a");
  await rc.waitForURL(/\/staff\/commissions\/[0-9a-f-]{36}$/);
  z = await ouvrir(rc, "Ajouter un membre");
  await choisir(z, "membreId", "PGM-MUA-0001");
  await z.locator("select[name=fonction]").selectOption("Secrétaire");
  await z.locator("button[type=submit]").click();
  await rc.waitForSelector("text=Membre ajouté.");
  await rc.reload();
  ok((await rc.textContent("[data-membre='PGM-MUA-0001']")).includes("Secrétaire"), "le responsable de commission y ajoute une choriste comme secrétaire");
  await rc.goto(`${APP}/staff/hebergement`);
  ok(!new URL(rc.url()).pathname.startsWith("/staff/hebergement"), "le responsable de commission n'a pas accès à l'hébergement");
  await c.goto(`${APP}/choriste/paroisse`);
  t = await texte(c);
  ok(t.includes("Mes commissions") && t.includes("Commission artistique") && t.includes("Secrétaire"), "la choriste voit sa commission et sa fonction");

  // Formations
  await rc.goto(`${APP}/staff/formations`);
  z = await ouvrir(rc, "Nouvelle formation");
  await z.locator("input[name=titre]").fill("Solfège niveau 1");
  await z.locator("input[name=debut]").fill(demain);
  await z.locator("input[name=places]").fill("1");
  await z.locator("button[type=submit]").click();
  await rc.waitForURL(/\/staff\/formations\/[0-9a-f-]{36}$/);
  const formation = rc.url();
  ok((await texte(rc)).includes("Commission artistique"), "le responsable crée une formation pour sa commission");
  z = await ouvrir(rc, "Inscrire des membres");
  await z.locator("label", { hasText: "PGM-MUA-0001" }).locator("input").check();
  await z.locator("button[type=submit]").click();
  await rc.waitForSelector("text=1 membre inscrit.");
  ok(true, "il inscrit une choriste");
  await rc.reload();
  const li = rc.locator("[data-inscrit='PGM-MUA-0001']");
  await li.locator("summary", { hasText: "Évaluer" }).click();
  await li.locator("select[name=statut]").selectOption("valide");
  await li.locator("input[name=note]").fill("15,5");
  await li.locator("input[name=appreciation]").fill("Bonne lecture rythmique");
  await li.getByRole("button", { name: "Enregistrer l'évaluation" }).click();
  await rc.waitForSelector("text=Évaluation enregistrée.");
  await rc.reload();
  t = await rc.textContent("[data-inscrit='PGM-MUA-0001']");
  ok(t.includes("15,5 / 20") && t.includes("Validé"), "il enregistre la note (15,5/20) et le résultat");
  await c.goto(`${APP}/choriste/formations`);
  t = await texte(c);
  ok(t.includes("Solfège niveau 1") && t.includes("15,5") && t.includes("Bonne lecture rythmique"), "la choriste voit sa formation, sa note et l'appréciation");
  await r.goto(formation);
  t = await texte(r);
  ok(t.includes("Solfège niveau 1") && (await r.locator("summary", { hasText: "Évaluer" }).count()) === 0,
    "un responsable de paroisse peut consulter la formation, sans pouvoir évaluer");

  // Projets et finances
  await rc.goto(`${APP}/staff/projets`);
  z = await ouvrir(rc, "Nouveau projet");
  await z.locator("input[name=titre]").fill("Achat de pupitres");
  await z.locator("input[name=budgetCdf]").fill("500 000");
  await z.locator("button[type=submit]").click();
  await rc.waitForURL(/\/staff\/projets\/[0-9a-f-]{36}$/);
  const projet = rc.url();
  ok(true, "le responsable crée un projet avec un budget de 500 000 FC");
  await rc.fill("input[name=titre][placeholder='Ex. Demander trois devis']", "Demander trois devis");
  await rc.getByRole("button", { name: "Ajouter la tâche" }).click();
  await rc.waitForSelector("text=Tâche ajoutée.");
  await rc.reload();
  await rc.locator("[data-tache='Demander trois devis']").getByRole("button", { name: "Terminer" }).click();
  await rc.waitForSelector("text=Tâches (1/1 terminées)");
  ok(true, "il ajoute une tâche puis la marque terminée");
  z = await ouvrir(rc, "Écrire un rapport");
  await z.locator("input[name=avancement]").fill("40");
  await z.locator("textarea[name=contenu]").fill("Trois devis reçus.");
  await z.locator("button[type=submit]").click();
  await rc.waitForSelector("text=Rapport enregistré : le projet est à 40 %.");
  await rc.reload();
  ok((await rc.getAttribute("[role=progressbar] >> nth=0", "aria-valuenow")) === "40" && (await texte(rc)).includes("En cours"),
    "le rapport d'avancement met le projet à 40 % et « En cours »");
  z = await ouvrir(rc, "Enregistrer une dépense ou une entrée");
  await z.locator("input[name=libelle]").fill("Acompte menuisier");
  await z.locator("input[name=montant]").fill("150 000");
  await z.locator("button[type=submit]").click();
  await rc.waitForSelector("text=Sortie de 150 000 FC enregistrée.");
  await rc.reload();
  t = await rc.textContent("[data-devise=CDF]");
  ok(t.includes("150 000 FC") && t.includes("350 000 FC"), "la dépense est déduite du budget (reste 350 000 FC)");

  await a.goto(`${APP}/staff/finances`);
  z = await ouvrir(a, "Enregistrer une entrée ou une sortie");
  await z.locator("input[name=sens][value=recette]").check();
  await z.locator("input[name=libelle]").fill("Cotisations d'octobre");
  await z.locator("input[name=montant]").fill("300");
  await z.locator("select[name=devise]").selectOption("USD");
  await z.locator("button[type=submit]").click();
  await a.waitForSelector("text=Entrée de 300,00 $ enregistrée.");
  await a.reload();
  ok((await a.textContent("[data-bilan=USD]")).includes("300,00 $") && (await a.textContent("[data-bilan=CDF]")).includes("-150 000 FC"),
    "les caisses en francs et en dollars sont comptées séparément");
  rep = await a.request.get(`${APP}/staff/finances/export?annee=${new Date().getFullYear()}`);
  t = await rep.text();
  ok(t.startsWith("﻿Date;") && t.includes("Acompte menuisier") && t.includes("-150000,00;CDF") && t.includes("300,00;USD"), "export Excel des finances");
  await rc.goto(`${APP}/staff/finances`);
  t = await texte(rc);
  ok(t.includes("Acompte menuisier") && !t.includes("Cotisations d'octobre"), "le responsable de commission ne voit que l'argent de ses projets");
  await r.goto(`${APP}/staff/finances`);
  ok(!new URL(r.url()).pathname.startsWith("/staff/finances"), "un responsable de paroisse n'a pas accès aux finances");
  rep = await r.request.get(`${APP}/staff/finances/export?annee=${new Date().getFullYear()}`);
  ok(!(await rep.text()).includes("Acompte menuisier") && !rep.url().includes("/export"), "ni à leur export (renvoyé vers son espace)");

  // Hébergement
  await a.goto(`${APP}/staff/hebergement`);
  for (const [nom, places, sexe] of [["Chambre 1", "1", ""], ["Chambre des femmes", "2", "F"]]) {
    z = await ouvrir(a, "Ajouter une chambre");
    await z.locator("input[name=nom]").fill(nom);
    await z.locator("input[name=site]").fill("Internat");
    await z.locator("input[name=capacite]").fill(places);
    await z.locator("select[name=sexe]").selectOption(sexe);
    await z.locator("button[type=submit]").click();
    await a.waitForSelector(`text=Chambre « ${nom} » ajoutée`);
    await a.reload();
  }
  ok(true, "l'administration ajoute deux chambres");
  async function loger(qui, chambre) {
    await a.reload();
    const f = await ouvrir(a, "Loger un choriste");
    await choisir(f, "membreId", qui);
    await choisir(f, "chambreId", chambre);
    await f.locator("input[name=du]").fill(jourDans(30));
    await f.locator("input[name=au]").fill(jourDans(33));
    await f.locator("button[type=submit]").click();
    await a.waitForSelector(`details[open] p[role=alert], details[open] p[role=status]`);
    return a.textContent("details[open] p[role=alert], details[open] p[role=status]");
  }
  ok((await loger("PGM-MUA-0001", "Chambre 1")).includes("Chambre attribuée"), "une choriste reçoit une chambre");
  ok((await loger("PGM-MUA-0002", "Chambre 1")).includes("Chambre complète"), "une chambre pleine est refusée");
  ok((await loger("PGM-MUA-0002", "Chambre des femmes")).includes("Renseignez le sexe"), "une chambre réservée aux femmes exige le sexe du membre");
  await c.goto(`${APP}/choriste/chambre`);
  t = await texte(c);
  ok(t.includes("Chambre 1") && t.includes("Internat") && t.includes("3 nuits") && !t.includes("Lukombo"),
    "la choriste voit sa chambre, sans les autres occupants");
  await c.goto(`${APP}/choriste/notifications`);
  ok((await texte(c)).includes("Hébergement : chambre Chambre 1 (Internat)"), "elle en est prévenue");

  // Chants
  await rc.goto(`${APP}/staff/chants`);
  for (const [titre, voix] of [["Nzambe azali malamu", null], ["Chant des basses", "basse"]]) {
    z = await ouvrir(rc, "Ajouter un chant");
    await z.locator("input[name=titre]").fill(titre);
    await z.locator("select[name=langue]").selectOption("Lingala");
    if (voix) await z.locator(`input[name=voix][value=${voix}]`).check();
    await z.locator("input[name=lienPartition]").fill("https://exemple.org/partition.pdf");
    await z.locator("textarea[name=paroles]").fill(`${titre}\nRefrain`);
    await z.locator("button[type=submit]").click();
    await rc.waitForURL(/\/staff\/chants\/[0-9a-f-]{36}$/);
    await rc.goto(`${APP}/staff/chants`);
  }
  ok(true, "le responsable ajoute deux chants au répertoire");
  await c.goto(`${APP}/choriste/chants`);
  t = await texte(c);
  ok(t.includes("Nzambe azali malamu") && !t.includes("Chant des basses"), "la choriste (ténor) voit les chants de sa voix");
  await c.click("text=Tous les chants");
  await c.waitForURL(/tous=1/);
  ok((await texte(c)).includes("Chant des basses"), "et peut afficher tout le répertoire");
  await c.click("[data-chant='Nzambe azali malamu'] a");
  await c.waitForURL(/\/choriste\/chants\/[0-9a-f-]{36}$/);
  t = await texte(c);
  ok(t.includes("Refrain") && (await c.getAttribute("text=Ouvrir la partition", "href")) === "https://exemple.org/partition.pdf",
    "elle lit les paroles et ouvre la partition");

  const chemin = (u) => new URL(u).pathname;
  const pageChant = chemin(c.url());
  await capture(a, "1-commissions", "/staff/commissions");
  await capture(rc, "2-commission", `/staff/commissions/${coms[0].id}`);
  await capture(rc, "3-formation", chemin(formation));
  await capture(rc, "4-projet", chemin(projet));
  await capture(a, "5-finances", "/staff/finances");
  await capture(a, "6-hebergement", "/staff/hebergement");
  await capture(rc, "7-chants", "/staff/chants");
  await capture(c, "8-mes-formations", "/choriste/formations", true);
  await capture(c, "9-ma-chambre", "/choriste/chambre", true);
  await capture(c, "10-mes-chants", "/choriste/chants", true);
  await capture(c, "11-chant", pageChant, true);
  await capture(c, "12-ma-paroisse", "/choriste/paroisse", true);

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
