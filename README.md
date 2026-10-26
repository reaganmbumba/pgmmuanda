# PGM MUANDA DIGITAL — EBNM KCC

Plateforme web de la Présidence générale de la musique (PGM) de Muanda :
gestion des choristes, cartes de membres avec QR code, programmes, présences,
communication, commissions, formations, projets et hébergement.

## État d'avancement

| Étape | Contenu | État |
| --- | --- | --- |
| 1 | Maquettes et interface responsive, PWA installable | **Terminée** |
| 2 | Base de données Supabase et authentification | **Terminée** |
| 3 | Gestion des membres et matricules | **Terminée** |
| 4 | Cartes PDF et QR codes fonctionnels | **Terminée** |
| 5 | Espace choriste et espace staff reliés aux données | **Terminée** |
| 6 | Programmes, annonces et présences | **Terminée** |
| 7 | Commissions, formations, projets, finances, hébergement et chants | **Terminée** |
| 8 | Sécurité, tests et déploiement en ligne | À venir |

Sans configuration Supabase, l'application tourne en **mode maquette** : les écrans
affichent un jeu de démonstration fictif (`src/lib/demo-data.ts`), signalé par un
bandeau doré. Avec Supabase configuré, plus aucune donnée de démonstration n'est affichée : la
connexion, les rôles, les membres, les cartes, le tableau de bord, l'accueil du
choriste et les notifications utilisent la vraie base. Les modules pas encore
construits (paramètres) indiquent l'étape où ils arriveront.

Programmes, annonces et présences (Étape 6) : chaque activité ou annonce vise toute la
PGM ou une paroisse, et tous les membres ou seulement certaines paroisses, chorales ou
voix. La base calcule elle-même qui est concerné : un choriste ne voit que ce qui le
concerne. Les présences se saisissent sur une feuille ou en scannant la carte QR du
choriste (le contrôleur peut pointer), et s'exportent pour Excel depuis « Rapports ».

Commissions, formations, projets, finances, hébergement et chants (Étape 7) :

- **Commissions** : membres et fonctions (responsable, secrétaire…), gérés par
  l'administration et par le responsable de la commission.
- **Formations** : inscriptions (avec nombre de places), note sur 20, résultat et
  appréciation ; le choriste voit ses formations et ses résultats.
- **Projets** : tâches, rapports d'avancement (en %), budget et dépenses.
- **Finances** : entrées et sorties d'argent en francs congolais et en dollars,
  toujours comptées séparément, avec export Excel. Visibles seulement par
  l'administration et, pour leurs projets, par les responsables de commission.
- **Hébergement** : chambres (places, hommes/femmes/mixte) et séjours ; la base refuse
  une chambre pleine ou un double hébergement. Visible seulement par l'administration
  et par le choriste concerné, qui ne voit que sa propre chambre.
- **Chants** : répertoire avec paroles et liens https vers les partitions et
  enregistrements (Google Drive, YouTube…). Le choriste voit d'abord les chants de sa voix.

Fichiers (Étape 8) : partitions des chants, photos des reçus et documents pour les
choristes (PDF, photo JPEG/PNG ou MP3, 4 Mo au plus). Le type réel de chaque fichier
est vérifié (un programme renommé en « .pdf » est refusé). Les fichiers sont rangés
dans la base elle-même : les mêmes règles d'accès s'appliquent, et une sauvegarde de
la base contient aussi les fichiers. Un reçu n'est visible que par ceux qui voient la
dépense ; un document n'est visible que par les choristes visés.

Sécurité (Étape 8) : en-têtes de protection (politique de contenu, interdiction
d'affichage dans un autre site, HTTPS obligatoire) et blocage d'un compte pendant
15 minutes après 5 mots de passe faux. Chacun peut changer son mot de passe dans
« Paramètres » (l'ancien mot de passe est demandé).

Sauvegardes (Étape 8) : copie chiffrée de toute la base chaque nuit, gardée 30 jours
par GitHub. À activer en suivant [docs/SAUVEGARDE.md](docs/SAUVEGARDE.md).

Les notifications sont internes à l'application (cloche et page « Notifications ») :
aucun message WhatsApp, SMS ou e-mail n'est envoyé automatiquement. Le bouton
« Partager sur WhatsApp » ouvre WhatsApp avec un message prêt ; c'est l'utilisateur
qui choisit le groupe et envoie.

Installation de la base : voir [docs/INSTALLATION-SUPABASE.md](docs/INSTALLATION-SUPABASE.md).

## Démarrer en local

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
cp .env.example .env.local   # facultatif à l'Étape 1
npm run dev
```

Puis ouvrir http://localhost:3000 :

- `/connexion` : page de connexion, avec les accès de démonstration ;
- `/staff` : tableau de bord administratif (optimisé ordinateur) ;
- `/choriste` : espace personnel du choriste (optimisé téléphone) ;
- `/verifier/demo-7Hq2LmZx9Kp4Rt` : page publique de vérification d'une carte.

## Technologies

Next.js 16 (routeur App) · TypeScript · Tailwind CSS 4 · lucide-react (icônes)
· qrcode.react (QR codes) · Supabase (PostgreSQL, Auth, RLS) · Zod · Vitest.

## Tests

```bash
npm test          # règles d'accès et validation des formulaires
npm run test:db   # migrations et règles de sécurité sur un PostgreSQL local
npm run test:e2e  # parcours complet dans un navigateur, sur une copie locale de Supabase
```

`test:e2e` démarre Supabase Auth et l'API REST sur un PostgreSQL local
(`PGURL=postgres://postgres:motdepasse@localhost:5432/postgres`), compile
l'application et vérifie 53 points : paroisses, inscription avec matricule
automatique, historique, espace choriste, demandes de correction, périmètre
du responsable de paroisse, cartes PDF, QR codes, vérification publique,
scan par caméra (webcam simulée), réédition et révocation, export et archives. Le vrai projet Supabase
n'est jamais touché.

## Structure

```
public/              logo PGM (clé de sol), icônes PWA
src/app/(auth)/      connexion, mot de passe oublié
src/app/staff/       espace staff (menu latéral de 18 entrées)
src/app/choriste/    espace choriste (barre d'onglets mobile)
src/app/verifier/    vérification publique d'une carte
src/components/      composants d'interface, carte de membre
src/lib/             navigation, types, données de démonstration
```

## Version HTML (sans installation)

Le dossier `export-html/` contient une copie statique de la maquette :
double-cliquer sur `export-html/index.html` suffit. Pour la régénérer :

```bash
npm run build && npm start      # dans un premier terminal
npm run export:html             # dans un second terminal
```

## Applications mobiles (Android et iOS)

L'application mobile est construite avec [Capacitor](https://capacitorjs.com) :
elle embarque la version HTML et fonctionne hors connexion.

La compilation se fait automatiquement sur GitHub, à chaque envoi sur `main`
(workflow « Applications mobiles »). Les fichiers sont à télécharger dans
l'onglet **Actions** › dernière exécution › **Artifacts** :

| Fichier | Usage |
| --- | --- |
| `app-debug.apk` | À installer directement sur un téléphone Android (test) |
| `app-release.aab` | À déposer sur le Google Play Store |
| `PGM-Muanda-non-signee.ipa` | iPhone : doit être signée avec un compte Apple Developer |

Pour signer l'APK et l'AAB de publication, ajouter dans *Settings › Secrets and
variables › Actions* : `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS` et `ANDROID_KEY_PASSWORD`. Sans ces secrets, seuls l'APK de
test et des fichiers de publication non signés sont produits.

Sur iPhone, en attendant, l'application s'installe depuis Safari :
**Partager › Sur l'écran d'accueil**.
