# Installer la base de données Supabase (Étape 2)

Ce guide se fait une seule fois, depuis le tableau de bord Supabase
du projet PGM Muanda (`https://wkokqwuqctgzxpbvyaxp.supabase.co`).

## 1. Créer les tables et les règles de sécurité

1. Ouvrir **SQL Editor** › **New query**.
2. Copier tout le contenu de
   `supabase/migrations/20261026000100_schema_initial.sql`, coller, puis **Run**.
3. Recommencer avec `supabase/migrations/20261026000200_securite_rls.sql`.
4. Recommencer avec `supabase/migrations/20261027000100_cartes.sql` (Étape 4 : cartes, photos).
5. Recommencer avec `supabase/migrations/20261028000100_notifications.sql` (Étape 5 : notifications).
6. Facultatif, pour essayer l'application : exécuter `supabase/seed-demo.sql`.
   Ces données sont fictives (« démo ») et s'effacent avec les commandes
   données à la fin du fichier.

Les fichiers doivent être exécutés **dans cet ordre**, une seule fois.

## 2. Régler l'authentification

Dans **Authentication** › **URL Configuration** :

- **Site URL** : l'adresse du site (pour l'instant `http://localhost:3000`,
  puis l'adresse définitive à l'Étape 8).
- **Redirect URLs** : ajouter `http://localhost:3000/**` (et plus tard l'adresse définitive).

**E-mails.** L'application fonctionne avec les modèles d'e-mail par défaut de
Supabase : les liens d'invitation et de réinitialisation sont reçus par
`/auth/confirm` puis `/auth/session`. Attention, le service d'envoi intégré de
Supabase est très limité (quelques e-mails par heure, et seulement vers les
adresses des membres de l'équipe Supabase). Pour inviter les choristes, il faut
configurer un SMTP personnalisé (**Authentication** › **Emails** › **SMTP Settings**),
prévu à l'Étape 8.

Facultatif, une fois le SMTP configuré : dans **Authentication** › **Emails** › **Templates**,
remplacer le lien des modèles suivants pour qu'ils passent directement par `/auth/confirm` :

| Modèle | Lien à mettre dans le bouton |
| --- | --- |
| Invite user | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&suite=/reinitialiser` |
| Reset password | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&suite=/reinitialiser` |

Dans **Authentication** › **Sign In / Providers**, désactiver **Allow new users to sign up** :
les comptes sont créés uniquement par invitation depuis l'application.

## 3. Configurer l'application

Copier `.env.example` en `.env.local` et compléter :

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://wkokqwuqctgzxpbvyaxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé « publishable » ou « anon »>
SUPABASE_SERVICE_ROLE_KEY=<clé « secret » ou « service_role »>
```

`NEXT_PUBLIC_SITE_URL` est l'adresse écrite dans les QR codes des cartes. Tant qu'elle vaut
`http://localhost:3000`, les cartes ne se vérifient que depuis votre ordinateur : n'imprimez pas
de cartes définitives avant d'y mettre l'adresse publique du site (Étape 8).

La clé `SUPABASE_SERVICE_ROLE_KEY` (Project Settings › API Keys) est **secrète** :
elle ne doit jamais être envoyée par message, mise sur GitHub ni dans une variable
commençant par `NEXT_PUBLIC_`. Le fichier `.env.local` est ignoré par Git.

## 4. Créer le premier administrateur

```bash
npm install
npm run admin:creer
```

Le script demande le nom, l'adresse e-mail, l'identifiant et le mot de passe,
puis crée le compte **Super administrateur**. Il refuse de s'exécuter si un
super administrateur existe déjà. Tous les autres comptes se créent ensuite
depuis **Utilisateurs et permissions** dans l'espace staff.

## 5. Lancer et se connecter

```bash
npm run dev
```

Ouvrir http://localhost:3000 et se connecter avec l'e-mail ou l'identifiant choisis.

## Rôles disponibles

| Rôle | Accès |
| --- | --- |
| Super administrateur | Tout, y compris la création d'autres super administrateurs |
| Présidence PGM | Tout sauf les comptes super administrateur |
| Responsable de paroisse | Membres et cartes de sa paroisse |
| Responsable de commission | Lecture des membres, sa commission (Étape 7) |
| Contrôleur | Scanner uniquement, sans accès aux fiches |
| Choriste | Son espace personnel ; demandes de correction |

Ces règles sont appliquées par la base elle-même (Row Level Security) : elles
restent valables même si quelqu'un contourne l'interface.

## Vérifier les règles de sécurité (développeurs)

Avec PostgreSQL 15 ou plus récent installé localement :

```bash
PGURL=postgres://postgres:motdepasse@localhost:5432/postgres npm run test:db
```

Le script crée une base jetable, applique les migrations et vérifie 64 règles
(matricules, historique, accès par rôle, cartes, photos, vérification publique,
notifications).

Note : un numéro de matricule n'est jamais réutilisé, même si une inscription
échoue ; il peut donc y avoir des trous dans la numérotation. C'est voulu.
