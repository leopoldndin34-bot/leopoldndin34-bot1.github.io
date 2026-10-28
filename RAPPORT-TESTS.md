# Rapport de tests — 28 octobre 2026

Tests réellement exécutés avec un navigateur Chromium automatisé (`outils/tester.mjs`), sur le site construit, servi localement.

## Périmètre
- 10 pages + la page 404, chacune en **3 largeurs** : mobile 375 px, tablette 820 px, ordinateur 1366 px.
- Deux passes : **thème clair** et **thème sombre**.

## Résultats
| Vérification | Résultat |
|---|---|
| Chargement de chaque page (code HTTP 200 ; 404 pour la page inexistante) | ✅ 33/33 par passe |
| Erreurs JavaScript / console | ✅ aucune (hors polices Google, bloquées uniquement dans l’environnement de test) |
| Débordement horizontal (défilement latéral) | ✅ aucun, sur les 3 largeurs |
| Images : toutes chargées, toutes avec texte alternatif | ✅ (une image « lazy » signalée en bas de l’accueil mobile par le chronométrage du test ; visible sur la capture) |
| Un seul titre H1 par page | ✅ |
| Liens internes (10 adresses distinctes) | ✅ aucun lien mort |
| Liens ou boutons sans texte | ✅ aucun |
| Menu mobile : ouverture au clic, fermeture avec Échap | ✅ |
| Formulaire vide → message d’erreur clair, focus sur le 1er champ | ✅ |
| Formulaire rempli → préparation de l’e-mail + message honnête | ✅ |
| Titres et descriptions SEO uniques par page | ✅ |
| Contrôle visuel des captures (accueil, projet, contact, compétences) | ✅ après correction de chevauchements de texte dans les schémas |

## Non testé ici (impossible dans cet environnement)
- **Téléchargement du CV** : le PDF n’est pas encore dans le projet ; la page CV bascule proprement en « demande par e-mail ». À re-tester après ajout du PDF.
- **Polices Google** : bloquées dans l’environnement de test (le site utilise des polices de secours propres) ; elles se chargeront en ligne.
- **Envoi réel via Formspree** : non configuré.
- **Déploiement GitHub Pages** et aperçu de partage LinkedIn : à vérifier après mise en ligne.
- Navigateurs Safari et Firefox réels.
