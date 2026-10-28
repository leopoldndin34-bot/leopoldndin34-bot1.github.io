# Guide d’utilisation du site (sans programmation)

Ce guide explique comment modifier et publier votre portfolio. Vous n’avez pas besoin de savoir coder : tout le contenu se trouve dans des fichiers texte du dossier **`contenu`**.

> Le plus simple : demandez à Claude dans ce projet (« ajoute tel projet », « change mon titre »…). Ce guide sert quand vous voulez le faire vous-même.

---

## 1. Où se trouve quoi

| Je veux changer… | Fichier à ouvrir |
|---|---|
| Mon nom, mon titre, ma phrase d’accroche | `contenu/site.json` → partie `identite` |
| Mon e-mail, LinkedIn, téléphone | `contenu/site.json` → partie `contact` |
| La page « À propos » | `contenu/site.json` → partie `a_propos` |
| Mes compétences | `contenu/site.json` → partie `competences` |
| Mes expériences et formations | `contenu/site.json` → parties `experiences` et `formations` |
| Le texte d’un projet | `contenu/projets/01-…md`, `02-…md`, `03-…md` |
| Une image | dossier `public/images/…` |
| Mon CV PDF | dossier `public/documents/` |

**Règle d’or dans `site.json`** : ne modifiez que le texte **entre guillemets**. Gardez les guillemets, les virgules et les accolades. Si vous utilisez des guillemets dans votre texte, utilisez « » plutôt que " ".

---

## 2. Modifier un texte

### Sur GitHub (une fois le site en ligne)
1. Ouvrez votre dépôt sur github.com.
2. Cliquez sur le dossier `contenu`, puis sur le fichier voulu.
3. Cliquez sur l’icône **crayon** (« Edit this file ») en haut à droite.
4. Modifiez le texte.
5. Cliquez sur **Commit changes…** puis à nouveau sur **Commit changes**.
6. Attendez 1 à 2 minutes : le site se met à jour tout seul. Vous pouvez suivre la progression dans l’onglet **Actions** (rond orange = en cours, coche verte = publié, croix rouge = erreur, voir § 8).

---

## 3. Ajouter un projet

1. Dans `contenu/projets`, ouvrez `_modele-projet.md` et copiez tout son contenu.
2. Créez un nouveau fichier dans `contenu/projets` (sur GitHub : **Add file → Create new file**), nommé par exemple `04-mon-nouveau-projet.md`.
3. Collez le modèle et remplacez les textes.
   - `slug` : le nom qui apparaîtra dans l’adresse web. **Minuscules, sans accents, des tirets à la place des espaces** (ex. `pont-mixte-yamoussoukro`).
   - `ordre` : position du projet dans la liste (1 = premier).
   - Les parties qui commencent par `## ` deviennent des sections (Contexte, Démarche…). Vous pouvez en ajouter ou en retirer.
   - Pour mettre un mot en gras : `**mot**`. Pour une liste : une ligne qui commence par `- `.
4. Ajoutez les images du projet (voir § 4) dans `public/images/projets/<slug>/`.
5. Validez (« Commit changes »). Le projet apparaît automatiquement sur l’accueil, la page Projets, avec sa propre page.

Les fichiers dont le nom commence par `_` ne sont jamais publiés : le modèle reste donc invisible.

---

## 4. Ajouter ou remplacer une image

1. Préparez l’image en **JPG** (photo, rendu) ou **PNG** (plan, capture). Largeur conseillée : 1600 px maximum, poids < 500 Ko (vous pouvez la compresser gratuitement sur squoosh.app).
2. Nommez-la sans espaces ni accents : `plan-methode-culee-cb.jpg`.
3. Sur GitHub, ouvrez `public/images/projets/<slug-du-projet>/` → **Add file → Upload files** → déposez l’image → **Commit changes**.
4. Dans le fichier du projet (`contenu/projets/…md`) :
   - **Image principale** : modifiez la ligne `illustration:` avec le chemin, par ex. `images/projets/metro-abidjan-ingenieur-methodes/plan-methode-culee-cb.jpg`, et la ligne `illustration_legende:`.
   - **Image dans la galerie** : dans `livrables:`, écrivez le chemin **avant** la barre `|`. Exemple :
     `  - images/projets/metro-abidjan-ingenieur-methodes/pose-dalles-spmt.jpg | Plan méthode de pose des dalles préfabriquées à l’aide d’un SPMT`
     Une galerie « Visuels » apparaît alors automatiquement.

⚠️ **Plans d’employeur** : ne publiez un plan méthode SICMA / Bouygues qu’avec l’accord écrit de votre hiérarchie. Sinon, gardez les schémas de principe actuels, ou floutez les cartouches, noms et cotes.

---

## 5. Mettre à jour mon CV

1. Exportez votre CV en PDF.
2. Renommez-le exactement : **`CV-Leopold-NDIN-Ingenieur-Travaux-Publics.pdf`**.
3. Sur GitHub : dossier `public/documents` → **Add file → Upload files** → déposez le fichier (il remplace l’ancien s’il porte le même nom) → **Commit changes**.

Dès que le fichier est présent, les boutons « Télécharger le CV » apparaissent partout et la page CV affiche le PDF. Tant qu’il est absent, la page CV propose de vous le demander par e-mail (aucun bouton cassé).

Pensez aussi à changer l’année dans `site.json` → `cv` → `mise_a_jour`.

---

## 6. Modifier mes coordonnées

Dans `contenu/site.json`, partie `contact` :

- `email` : votre adresse.
- `linkedin_url` : collez l’adresse complète de votre profil (ex. `https://www.linkedin.com/in/votre-profil/`). Vide = le lien LinkedIn n’est pas affiché.
- `telephone` + `afficher_telephone` : mettez `true` (sans guillemets) pour afficher le numéro, `false` pour le masquer. Il est masqué par défaut pour limiter le démarchage.
- `formulaire_endpoint` : voir § 7.

---

## 7. Le formulaire de contact

**Par défaut**, le formulaire **prépare un e-mail** dans la messagerie du visiteur, qui l’envoie lui-même. Rien n’est envoyé en cachette, et le site l’indique clairement.

**Pour recevoir les messages directement** (gratuit jusqu’à 50 messages/mois chez Formspree, à vérifier sur leur site) :
1. Créez un compte sur formspree.io avec votre e-mail.
2. Créez un formulaire « New form » ; Formspree vous donne une adresse du type `https://formspree.io/f/abcdwxyz`.
3. Collez-la dans `site.json` → `contact` → `formulaire_endpoint`.
4. Le bouton devient « Envoyer » et affiche une vraie confirmation ou une vraie erreur.

---

## 8. Mettre le site en ligne (première fois) — gratuit

**Coût** : 0 € avec GitHub Pages. Seul un nom de domaine personnalisé (ex. `leopold-ndin.com`) est payant, en général 10 à 20 € par an selon l’extension et le registraire : il est **facultatif**.

### Étape A — Créer le dépôt
1. Créez un compte gratuit sur **github.com**. Choisissez bien votre **nom d’utilisateur** : il fera partie de l’adresse du site.
2. Cliquez sur **+** (en haut à droite) → **New repository**.
3. Nom du dépôt : **`votre-nom-utilisateur.github.io`** (exactement, en minuscules). Votre site sera alors à l’adresse `https://votre-nom-utilisateur.github.io/`.
4. Cochez **Public**, puis **Create repository**.

### Étape B — Envoyer les fichiers
1. Décompressez le fichier `portfolio-leopold-ndin.zip` sur votre ordinateur.
2. Dans le dépôt, cliquez sur **uploading an existing file**.
3. Ouvrez le dossier décompressé, sélectionnez **tout son contenu** (pas le dossier lui-même) et glissez-le dans la page. Puis **Commit changes**.
4. Le dossier caché `.github` est parfois ignoré lors du glisser-déposer. Pour l’ajouter à la main : **Add file → Create new file**, tapez comme nom `.github/workflows/deploy.yml`, collez le contenu du fichier `deploy.yml` fourni, puis **Commit changes**.

### Étape C — Activer la publication
1. Dans le dépôt : **Settings → Pages**.
2. Dans **Source**, choisissez **GitHub Actions**.
3. Allez dans l’onglet **Actions** : la publication démarre (si rien ne se passe, cliquez sur « Publier le site » puis **Run workflow**).
4. Après la coche verte, votre site est en ligne.

### Étape D — Indiquer l’adresse au site
Dans `contenu/site.json` → `seo` → `url_du_site`, mettez `https://votre-nom-utilisateur.github.io` et validez. Cela active l’aperçu de partage (LinkedIn, WhatsApp), le plan du site pour Google et l’adresse officielle des pages.

> Si vous nommez le dépôt autrement (ex. `portfolio`), l’adresse sera `https://votre-nom.github.io/portfolio/` : mettez alors `"chemin_de_base": "/portfolio/"`.

**Solution de secours ultra-rapide** : sur app.netlify.com/drop, glissez le dossier `dist` (le site déjà fabriqué). Le site est en ligne en 30 secondes, mais chaque mise à jour demande de redéposer le dossier.

---

## 9. Si la publication échoue (croix rouge)

Presque toujours, c’est une virgule ou un guillemet manquant dans `site.json`. Ouvrez l’onglet **Actions**, cliquez sur l’échec, le message indique la ligne. Vous pouvez aussi copier ce message à Claude. Pour annuler votre dernière modification : ouvrez le fichier → **History** → revenez à la version précédente.

---

## 10. Pour aller plus loin (facultatif)

- **Tester sur votre ordinateur** : installez Node.js (nodejs.org), ouvrez un terminal dans le dossier et tapez `npm install` puis `npm run apercu`. Le site s’ouvre sur http://localhost:4321.
- **QR code du CV** : une fois le site en ligne, demandez à Claude de générer le QR code vers votre adresse pour l’intégrer au CV.
