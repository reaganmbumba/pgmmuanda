/**
 * Crée le premier compte « super administrateur » de PGM MUANDA DIGITAL.
 *
 * Sécurité :
 * - s'exécute uniquement en ligne de commande, jamais depuis une page web ;
 * - utilise la clé SUPABASE_SERVICE_ROLE_KEY lue dans .env.local (jamais committée) ;
 * - refuse de s'exécuter s'il existe déjà un super administrateur.
 *
 * Usage : npm run admin:creer
 */
import fs from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createClient } from "@supabase/supabase-js";

function lireEnv(fichier) {
  if (!fs.existsSync(fichier)) return {};
  return Object.fromEntries(
    fs.readFileSync(fichier, "utf8").split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
  );
}

const env = { ...lireEnv(".env.local"), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const cle = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !cle) {
  console.error("Renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local.");
  process.exit(1);
}

const supabase = createClient(url, cle, { auth: { autoRefreshToken: false, persistSession: false } });

const { count, error: errCompte } = await supabase
  .from("profils").select("id", { count: "exact", head: true }).eq("role", "super_admin");
if (errCompte) {
  console.error("Impossible de lire la base. Les migrations SQL ont-elles été appliquées ?", errCompte.message);
  process.exit(1);
}
if (count > 0) {
  console.error("Un super administrateur existe déjà. Les autres comptes se créent depuis « Utilisateurs et permissions ».");
  process.exit(1);
}

const rl = readline.createInterface({ input, output });
const nom = (await rl.question("Nom complet : ")).trim();
const email = (await rl.question("Adresse e-mail : ")).trim().toLowerCase();
const identifiant = (await rl.question("Identifiant de connexion (ex. admin.pgm) : ")).trim().toLowerCase();
const motDePasse = await rl.question("Mot de passe (10 caractères minimum, lettres et chiffres) : ");
rl.close();

const erreurs = [];
if (nom.length < 2) erreurs.push("nom trop court");
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) erreurs.push("adresse e-mail invalide");
if (!/^[a-z0-9._-]{3,40}$/.test(identifiant)) erreurs.push("identifiant invalide (3 à 40 caractères : lettres, chiffres, . _ -)");
if (motDePasse.length < 10 || !/[A-Za-z]/.test(motDePasse) || !/[0-9]/.test(motDePasse)) erreurs.push("mot de passe trop faible");
if (erreurs.length) {
  console.error("Erreur : " + erreurs.join(", ") + ".");
  process.exit(1);
}

const { data, error } = await supabase.auth.admin.createUser({
  email, password: motDePasse, email_confirm: true, user_metadata: { nom_affiche: nom },
});
if (error) {
  console.error("Création du compte impossible :", error.message);
  process.exit(1);
}

const { error: errProfil } = await supabase
  .from("profils").update({ role: "super_admin", nom_affiche: nom, identifiant }).eq("id", data.user.id);
if (errProfil) {
  console.error("Compte créé, mais le rôle n'a pas pu être attribué :", errProfil.message);
  process.exit(1);
}
console.log(`Super administrateur créé : ${nom} <${email}> (identifiant : ${identifiant}).`);
