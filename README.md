# Portfolio — Léopold César N’DIN N’DIN

Site statique (HTML/CSS/JS) généré par un petit script Node (`build.mjs`) à partir de fichiers de contenu.

- **Contenu** : `contenu/site.json` (profil, contacts, compétences, parcours) et `contenu/projets/*.md` (une étude de cas par fichier).
- **Ressources** : `public/` (styles, script, images, CV PDF), copiées telles quelles.
- **Construction** : `npm install && npm run build` → dossier `dist/`.
- **Aperçu local** : `npm run apercu` → http://localhost:4321
- **Publication** : `.github/workflows/deploy.yml` publie `dist/` sur GitHub Pages à chaque push sur `main`.
- **Outils** : `outils/tester.mjs` (contrôle qualité Playwright), `outils/generer-images.mjs` (image de partage, icône).

Choix techniques : pas de framework ni de base de données (inutiles pour un portfolio), une seule dépendance (`marked`), aucun traceur, liens relatifs (fonctionne quel que soit le nom du dépôt), SEO (titres, descriptions, Open Graph, JSON-LD Person, sitemap quand l’URL est renseignée), accessibilité (HTML sémantique, lien d’évitement, focus visible, contrastes, `prefers-reduced-motion`), thème clair/sombre automatique.

Mode d’emploi pour non-développeur : voir **GUIDE.md**.
