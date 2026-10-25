# PGM MUANDA DIGITAL — EBNM KCC

Plateforme web de la Présidence générale de la musique (PGM) de Muanda :
gestion des choristes, cartes de membres avec QR code, programmes, présences,
communication, commissions, formations, projets et hébergement.

## État d'avancement

| Étape | Contenu | État |
| --- | --- | --- |
| 1 | Maquettes et interface responsive, PWA installable | **Terminée** |
| 2 | Base de données Supabase et authentification | À venir |
| 3 | Gestion des membres et matricules | À venir |
| 4 | Cartes PDF et QR codes fonctionnels | À venir |
| 5 | Espace choriste et espace staff reliés aux données | À venir |
| 6 | Programmes, annonces et présences | À venir |
| 7 | Commissions, formations, projets et hébergement | À venir |
| 8 | Sécurité, tests et déploiement en ligne | À venir |

À l'Étape 1, les écrans affichent un **jeu de démonstration fictif**
(`src/lib/demo-data.ts`), signalé par un bandeau doré en haut de chaque page.
Aucune donnée n'est enregistrée.

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
· qrcode.react (QR codes). Supabase sera ajouté à l'Étape 2.

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
