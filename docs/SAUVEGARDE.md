# Sauvegardes de la base

Chaque nuit (vers 2 h, heure de Muanda), GitHub fait une copie de toutes les données
de la PGM : membres, cartes, programmes, présences, finances, fichiers et comptes de
connexion. La copie est **chiffrée** : sans la phrase secrète, personne ne peut la lire.
GitHub garde chaque copie **30 jours**.

Tant que les deux réglages ci-dessous ne sont pas faits, la sauvegarde ne fait rien
(elle affiche seulement « Sauvegarde non configurée »).

## 1. Copier l'adresse de la base (une seule fois)

1. Ouvrez votre projet sur https://supabase.com/dashboard.
2. En haut, cliquez sur **Connect**.
3. Choisissez **Session pooler** (et non « Direct connection » : GitHub ne peut pas
   l'utiliser).
4. Copiez l'adresse qui commence par `postgresql://postgres.` …
5. Dans cette adresse, remplacez `[YOUR-PASSWORD]` par le mot de passe de la base.
   (Oublié ? Supabase : **Project Settings** → **Database** → **Reset database password**.)

## 2. Choisir une phrase secrète

Choisissez une phrase longue, par exemple quatre mots sans rapport entre eux.
**Écrivez-la sur papier et gardez-la en lieu sûr.** Sans elle, les sauvegardes
ne peuvent pas être ouvertes, et personne ne peut la retrouver.

## 3. Donner les deux réglages à GitHub

1. Ouvrez https://github.com/reaganmbumba/pgmmuanda/settings/secrets/actions
2. Cliquez sur **New repository secret**.
3. Nom : `SUPABASE_DB_URL` — Valeur : l'adresse de l'étape 1. Cliquez **Add secret**.
4. Cliquez encore sur **New repository secret**.
5. Nom : `PHRASE_SECRETE` — Valeur : la phrase de l'étape 2. Cliquez **Add secret**.

Ces valeurs restent cachées dans GitHub. Ne les envoyez jamais dans une discussion.

## 4. Vérifier que ça marche

1. Ouvrez https://github.com/reaganmbumba/pgmmuanda/actions/workflows/sauvegarde.yml
2. Cliquez sur **Run workflow**, puis sur le bouton vert **Run workflow**.
3. Attendez quelques minutes : une coche verte doit apparaître.
4. Cliquez sur la ligne : en bas, sous **Artifacts**, vous voyez
   `pgm-sauvegarde-…`. C'est la sauvegarde (un fichier `.zip` qui contient
   le fichier chiffré `.gpg`).

## 5. Restaurer une sauvegarde (en cas de problème grave)

Il faut un ordinateur avec `psql`, `gpg` et `gunzip` (Linux ou macOS), et une base
Supabase **neuve** où les migrations ont été exécutées dans l'ordre
(voir [INSTALLATION-SUPABASE.md](INSTALLATION-SUPABASE.md)).

```bash
unzip pgm-sauvegarde-123.zip
BASE_URL='postgresql://…(adresse de la nouvelle base)…' \
PHRASE_SECRETE='…votre phrase…' \
bash scripts/restaurer.sh pgm-sauvegarde-AAAA-MM-JJ.sql.gz.gpg
```

À la fin, le script affiche le nombre de membres restaurés. Les numéros de matricule
suivants continuent la numérotation.

Faire une sauvegarde à la main, depuis un ordinateur :

```bash
BASE_URL='postgresql://…' PHRASE_SECRETE='…' bash scripts/sauvegarde.sh
```

## Ce qui a été vérifié

`npm run test:sauvegarde` fait une sauvegarde d'une base de test, vérifie qu'elle est
illisible sans la phrase et qu'une mauvaise phrase est refusée, puis la restaure dans
une base neuve et compare les 27 tables et les fichiers octet par octet.
Ce test tourne sur PostgreSQL en local ; il n'a pas encore été fait sur la vraie base
Supabase.
