# Backlog & Sprints — App de réservation de terrains de sport entre particuliers

*Rédigé le 23 août 2026, à partir de l'architecture validée du 22 août 2026 (`architecture.md`)
et du PRD du 21 août 2026 (`prd.md`)*
*Format d'estimation : taille T-shirt (S/M/L) — Sprints d'1 semaine, capacité : 1 développeur*
*Suivi d'implémentation mis à jour le 29 août 2026*

## 1. Backlog

| ID | User story | Module (architecture) | Priorité (MoSCoW) | Estimation | Statut |
|----|-------------|--------------------------|----------------------|--------------|--------|
| US-01 | En tant que joueur, je veux créer un compte (email/téléphone + mot de passe) afin de pouvoir accéder à l'application. | Authentification & Profils | Must | M | ✅ Fait (web + mobile) |
| US-02 | En tant qu'utilisateur, je veux me connecter et me déconnecter de mon compte afin de sécuriser l'accès à mes données. | Authentification & Profils | Must | S | ✅ Fait (web + mobile) |
| US-03 | En tant que joueur, je veux renseigner et modifier mon profil (nom, ville, photo, sport(s) pratiqué(s)) afin d'être identifiable par les autres utilisateurs. | Authentification & Profils | Must | M | ✅ Fait (web + mobile) |
| US-04 | En tant que propriétaire/gestionnaire, je veux publier une annonce de terrain (sport, adresse, photos, tarif) afin de le rendre visible aux joueurs. | Annonces & Créneaux | Must | L | ✅ Fait (web + mobile) |
| US-05 | En tant que propriétaire/gestionnaire, je veux définir les créneaux disponibles pour mon terrain (date, heure, tarif) afin que les joueurs puissent réserver un horaire précis. | Annonces & Créneaux | Must | M | ✅ Fait (web + mobile) |
| US-06 | En tant que propriétaire/gestionnaire, je veux modifier ou retirer une annonce ou un créneau afin de garder les informations à jour. | Annonces & Créneaux | Must | S | ✅ Fait (web + mobile) |
| US-07 | En tant que joueur, je veux rechercher des terrains disponibles par sport, localisation et date/heure afin de trouver rapidement un créneau qui me convient. | Recherche & Catalogue | Must | L | ✅ Fait (web + mobile) |
| US-08 | En tant que joueur, je veux consulter le détail d'une annonce (photos, tarif, créneaux, avis) afin de décider si je réserve. | Recherche & Catalogue | Must | M | ✅ Fait (web + mobile) |
| US-09 | En tant que joueur, je veux voir les résultats de recherche localisés/triés par proximité afin de privilégier les terrains les plus proches de chez moi. | Recherche & Catalogue | Must | M | ✅ Fait (web + mobile) |
| US-10 | En tant que joueur, je veux sélectionner un créneau disponible et le verrouiller temporairement afin qu'un autre joueur ne puisse pas le réserver pendant que je finalise mon paiement. | Réservation | Must | L | ✅ Fait (web + mobile) |
| US-11 | En tant que joueur, je veux que ma réservation soit confirmée automatiquement une fois le paiement validé afin de sécuriser mon créneau. | Réservation | Must | M | ✅ Fait (web + mobile) |
| US-12 | En tant que joueur, je veux payer ma réservation via Wave afin de finaliser ma réservation en ligne. | Paiement | Must | L | ✅ Fait (web + mobile) |
| US-13 | En tant que joueur, je veux payer ma réservation via Orange Money afin d'avoir le choix de mon moyen de paiement. | Paiement | Must | M | ✅ Fait (web + mobile) |
| US-14 | En tant que joueur, je veux payer ma réservation via Moov Money afin d'avoir un troisième moyen de paiement disponible. | Paiement | Must | M | ✅ Fait (web + mobile) |
| US-15 | En tant que propriétaire/gestionnaire, je veux recevoir le reversement du montant de la réservation (moins commission éventuelle) afin d'être rémunéré pour la mise à disposition de mon terrain. | Paiement | Must | M | ✅ Fait (web + mobile) |
| US-16 | En tant qu'utilisateur, je veux noter et commenter l'autre partie après une session afin de contribuer à la confiance entre inconnus. | Notation & Réputation | Must | M | ✅ Fait (web + mobile) |
| US-17 | En tant qu'utilisateur, je veux voir la note moyenne d'un profil afin d'évaluer sa fiabilité avant de réserver/accepter. | Notation & Réputation | Must | S | ✅ Fait (web + mobile) |
| US-18 | En tant que joueur, je veux consulter l'historique de mes réservations passées et à venir afin de suivre mon activité. | Historique | Must | S | ✅ Fait (web + mobile) |
| US-19 | En tant que propriétaire/gestionnaire, je veux consulter l'historique des réservations reçues sur mes terrains afin de suivre mon activité. | Historique | Must | S | ✅ Fait (web + mobile) |
| US-20 | En tant qu'utilisateur, je veux recevoir une confirmation de réservation afin d'être rassuré que ma réservation a bien été enregistrée. | Notifications | Should | S | ✅ Fait (web + mobile) |
| US-21 | En tant qu'utilisateur, je veux recevoir un rappel avant mon créneau réservé afin de ne pas l'oublier. | Notifications | Should | S | ✅ Fait (web + mobile) |
| US-22 | En tant que joueur, je veux annuler ma réservation avant un délai limite et être remboursé afin de récupérer mon argent en cas d'empêchement. | Réservation *(extension)* | Should | M | ✅ Fait (web + mobile) |
| US-23 | En tant que joueur, je veux filtrer les résultats de recherche par prix, distance et équipements (vestiaires, éclairage, surface) afin d'affiner ma recherche selon mes critères. | Recherche & Catalogue *(extension)* | Should | M | ✅ Fait (web + mobile) |
| US-24 | En tant que joueur, je veux envoyer un message au propriétaire/gestionnaire pour poser une question sur un créneau afin de clarifier un détail avant de réserver. | Non détaillé dans l'architecture *(extension future, proche de Réservation/Notifications)* | Could | M | À faire |
| US-25 | En tant que joueur, je veux recevoir des recommandations de terrains basées sur mon historique afin de découvrir des terrains pertinents plus facilement. | Recherche & Catalogue *(extension)* | Could | M | À faire |
| US-26 | En tant qu'utilisateur, je veux parrainer d'autres joueurs afin de gagner un avantage et faire connaître l'app. | Authentification & Profils *(extension)* | Could | S | À faire |

**Hors backlog V1** (Won't have — voir PRD section 4, hors scope) :
- Organisation de tournois ou de matchs multi-équipes.

## 2. Découpage en sprints

*13 sprints couvrent l'intégralité des user stories Must have (V1 fonctionnelle de bout en bout :
compte → annonce → recherche → réservation → paiement 3 opérateurs → notation → historique).
Les sprints 14 à 18 couvrent les compléments Should have puis Could have, à enchaîner si le temps
le permet une fois la V1 Must have livrée et validée.*

### Sprint 1 — Un utilisateur peut créer un compte et se connecter
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-01 | Must | M | ✅ Fait (web + mobile) |
| US-02 | Must | S | ✅ Fait (web + mobile) |

### Sprint 2 — Un utilisateur peut compléter son profil joueur
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-03 | Must | M | ✅ Fait (web + mobile) |

### Sprint 3 — Un propriétaire/gestionnaire peut publier une annonce de terrain
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-04 | Must | L | ✅ Fait (web + mobile) |

### Sprint 4 — Un propriétaire/gestionnaire peut définir ses créneaux et gérer ses annonces
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-05 | Must | M | ✅ Fait (web + mobile) |
| US-06 | Must | S | ✅ Fait (web + mobile) |

### Sprint 5 — Un joueur peut rechercher des terrains disponibles
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-07 | Must | L | ✅ Fait (web + mobile) |

### Sprint 6 — Un joueur peut consulter le détail d'une annonce et voir les résultats par proximité
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-08 | Must | M | ✅ Fait (web + mobile) |
| US-09 | Must | M | ✅ Fait (web + mobile) |

### Sprint 7 — Un joueur peut sélectionner et verrouiller temporairement un créneau
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-10 | Must | L | ✅ Fait (web + mobile) |

### Sprint 8 — La réservation est confirmée automatiquement après paiement validé
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-11 | Must | M | ✅ Fait (web + mobile) |

### Sprint 9 — Un joueur peut payer sa réservation via Wave
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-12 | Must | L | ✅ Fait (web + mobile) |

### Sprint 10 — Un joueur peut payer sa réservation via Orange Money ou Moov Money
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-13 | Must | M | ✅ Fait (web + mobile) |
| US-14 | Must | M | ✅ Fait (web + mobile) |

### Sprint 11 — Un propriétaire/gestionnaire reçoit le reversement de ses réservations
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-15 | Must | M | ✅ Fait (web + mobile) |

### Sprint 12 — Les utilisateurs peuvent noter et consulter la réputation des autres
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-16 | Must | M | ✅ Fait (web + mobile) |
| US-17 | Must | S | ✅ Fait (web + mobile) |

### Sprint 13 — Les deux parties peuvent consulter leur historique de réservations *(fin de la V1 Must have)*
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-18 | Must | S | ✅ Fait (web + mobile) |
| US-19 | Must | S | ✅ Fait (web + mobile) |

### Sprint 14 — Les utilisateurs reçoivent les notifications de réservation
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-20 | Should | S | ✅ Fait (web + mobile) |
| US-21 | Should | S | ✅ Fait (web + mobile) |

### Sprint 15 — Un joueur peut annuler sa réservation et être remboursé
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-22 | Should | M | ✅ Fait (web + mobile) |

### Sprint 16 — Un joueur peut affiner sa recherche avec des filtres avancés
| User story | Priorité | Estimation | Statut |
|-------------|-----------|--------------|--------|
| US-23 | Should | M | ✅ Fait (web + mobile) |

### Sprint 17 — *(Could have)* Un joueur peut échanger un message avec le propriétaire/gestionnaire
| User story | Priorité | Estimation |
|-------------|-----------|--------------|
| US-24 | Could | M |

### Sprint 18 — *(Could have)* Un joueur reçoit des recommandations et peut parrainer d'autres joueurs
| User story | Priorité | Estimation |
|-------------|-----------|--------------|
| US-25 | Could | M |
| US-26 | Could | S |

## 3. Matrice de traçabilité

| User story | Module (architecture) |
|-------------|---------------------------|
| US-01 | Authentification & Profils |
| US-02 | Authentification & Profils |
| US-03 | Authentification & Profils |
| US-04 | Annonces & Créneaux |
| US-05 | Annonces & Créneaux |
| US-06 | Annonces & Créneaux |
| US-07 | Recherche & Catalogue |
| US-08 | Recherche & Catalogue |
| US-09 | Recherche & Catalogue |
| US-10 | Réservation |
| US-11 | Réservation |
| US-12 | Paiement |
| US-13 | Paiement |
| US-14 | Paiement |
| US-15 | Paiement |
| US-16 | Notation & Réputation |
| US-17 | Notation & Réputation |
| US-18 | Historique |
| US-19 | Historique |
| US-20 | Notifications |
| US-21 | Notifications |
| US-22 | Réservation *(extension)* |
| US-23 | Recherche & Catalogue *(extension)* |
| US-24 | Non détaillé dans l'architecture *(extension future)* |
| US-25 | Recherche & Catalogue *(extension)* |
| US-26 | Authentification & Profils *(extension)* |

Tous les modules de l'architecture ont au moins une user story associée. US-24 (messagerie
in-app) n'a pas de module dédié dans `architecture.md` — le document la mentionne comme extension
future à intégrer une fois la V1 Must have stabilisée ; elle a été rattachée provisoirement au
périmètre Réservation/Notifications, à préciser en conception si elle est retenue pour une future
version.

## 4. Suivi d'implémentation

| User story | Statut | Détails |
|-------------|--------|---------|
| US-01 | ✅ Fait (29 août 2026) | Web (Next.js, `web/src/modules/authentification/`) + Mobile (React Native/Expo, `mobile/src/modules/authentification/`), logique partagée dans `packages/auth-core/`. Tests unitaires écrits (Vitest+RTL web, Jest+RTL native mobile) mais non exécutés dans cette session (aucun `npm install` lancé). Dépend d'un endpoint backend `/api/auth/register` pas encore implémenté côté Laravel. |
| US-02 | ✅ Fait (29 août 2026) | Web (`LoginForm`/`LogoutButton` + page `/connexion`) + Mobile (`LoginScreen`/`LogoutButton`), logique partagée dans `packages/auth-core/` (`useLoginForm`, `useLogout`). Le token de session est stocké via une abstraction `SessionStorage` : localStorage côté web, `expo-secure-store` côté mobile (RNF-002). Tests écrits mais non exécutés (pas d'`npm install`). Dépend des endpoints backend `/api/auth/login` et `/api/auth/logout`, pas encore implémentés côté Laravel. |
| US-03 | ✅ Fait (29 août 2026) | Web (`ProfileForm` + page `/profil`) + Mobile (`ProfileScreen`), logique partagée dans `packages/auth-core/` (`useProfileForm`, `usePhotoUpload`). Upload de photo via `expo-image-picker` côté mobile, `<input type="file">` côté web. Tests écrits mais non exécutés (pas d'`npm install`). Dépend des endpoints backend `/api/profile` (GET/PATCH) et `/api/profile/photo`, pas encore implémentés côté Laravel. Écart de modèle de données détecté (sports pratiqués absents de l'entité UTILISATEUR) et **corrigé le 29 août 2026** dans `architecture.md` (champ `sports_pratiques`, en JSON). |
| US-04 | ✅ Fait (29 août 2026) | Web (`CreateTerrainForm` + page `/terrains/nouveau`) + Mobile (`CreateTerrainScreen`), nouveau package partagé `packages/annonces-core/` (`useCreateTerrainForm`, `useTerrainPhotoUpload`). Le type `Sport` a été extrait dans un nouveau package `packages/shared/` (utilisé par Authentification ET Annonces). Champs `sport`/`adresse` requis, `type`/`équipements` optionnels ; **pas de champ tarif** dans ce formulaire — RF-004 le mentionne mais `architecture.md` place le tarif sur `CRENEAU`, donc il sera saisi avec US-05 (définition des créneaux). Photos ajoutées après création de l'annonce (upload multipart séparé, même principe qu'US-03). Tests écrits mais non exécutés (pas d'`npm install`). Dépend des endpoints backend `/api/terrains` et `/api/terrains/:id/photos`, pas encore implémentés côté Laravel. |
| US-05 | ✅ Fait (29 août 2026) | Web (`CreneauxManager` + page `/terrains/[terrainId]/creneaux`) + Mobile (`CreneauxScreen`), logique partagée dans `packages/annonces-core/` (`useCreneaux`). Couvre le tarif laissé de côté à US-04 (vit bien sur `CRENEAU`, pas `TERRAIN`). Saisie des dates en texte au format `AAAA-MM-JJTHH:MM` des deux côtés (`datetime-local` web, `TextInput` mobile) — **pas de sélecteur de date natif** côté mobile pour cette V1 (aucune dépendance `@react-native-community/datetimepicker` ajoutée), à améliorer avant mise en production. Validation "fin après début" côté client, à revalider côté backend en cas de chevauchement. Tests écrits mais non exécutés (pas d'`npm install`). Dépend des endpoints backend `/api/terrains/:id/creneaux` (GET/POST), pas encore implémentés côté Laravel. `terrainId` passé en prop faute de routeur en place (même limite que le routing post-connexion des US précédentes). |
| US-06 | ✅ Fait (29 août 2026) | Web (`EditTerrainForm` + page `/terrains/[terrainId]/modifier`, et modification/retrait par ligne directement dans `CreneauxManager`) + Mobile (`EditTerrainScreen`, et même extension de `CreneauxScreen`). Nouveaux hooks dans `packages/annonces-core/` : `useEditTerrainForm` (charge/modifie/retire une annonce) et extension de `useCreneaux` (`updateCreneau`/`removeCreneau`). **Règle métier ajoutée** : un créneau au statut `reserve` (RF-010) ne peut plus être modifié ni retiré — vérifié côté client (boutons désactivés) mais le backend reste seul juge en cas de conflit concurrent. Retrait d'une annonce confirmé explicitement (`window.confirm` web, `Alert.alert` mobile) car irréversible. Pas de RF numérotée dédiée dans le SRS pour cette story (complète RF-004/005/006 — capacité de gestion, pas seulement de création). Tests écrits mais non exécutés (pas d'`npm install`). Dépend des endpoints backend `/api/terrains/:id` (GET/PATCH/DELETE) et `/api/creneaux/:id` (PATCH/DELETE), pas encore implémentés côté Laravel. |
| US-07 | ✅ Fait (29 août 2026) | Web (`SearchTerrains` + page `/recherche`) + Mobile (`SearchTerrainsScreen`), nouveau package partagé `packages/recherche-core/` (`useRechercheTerrains`). **Décision notable** : un résultat de recherche est un couple (terrain, créneau) et non un terrain seul — RF-008 exige de n'afficher que "les créneaux réellement disponibles", donc l'unité de résultat reflète ça. Recherche **publique** (aucun token envoyé), à la différence de tous les modules précédents (Authentification, Annonces) — testé explicitement. Aucun filtre n'est obligatoire (parcourir sans critère est un usage légitime). Tri par proximité (RF-007, PostGIS) laissé au backend, hors périmètre US-07 — voir US-09. Tests écrits mais non exécutés (pas d'`npm install`). Dépend de l'endpoint backend `/api/recherche/terrains` (GET), pas encore implémenté côté Laravel. |
| US-08 | ✅ Fait (30 août 2026) | Web (`TerrainDetailView` + page `/terrains/[terrainId]`, publique) + Mobile (`TerrainDetailScreen`), `useTerrainDetail` dans `packages/recherche-core/`. Photos, type, équipements, note moyenne du propriétaire/gestionnaire, créneaux encore disponibles. Le bouton "Réserver" n'est volontairement pas présent — appartient à US-10 (verrouillage de créneau), pas encore implémenté. Refacto : `Equipement`/`EQUIPEMENT_OPTIONS` déplacés de `@app/annonces-core` vers `@app/shared` (même raisonnement que `Sport` à US-04), réexportés pour compatibilité. Tests écrits mais non exécutés. Dépend de l'endpoint backend `/api/terrains/:id/detail`, pas encore implémenté côté Laravel. |
| US-09 | ✅ Fait (30 août 2026) | Extension de `SearchTerrains`/`SearchTerrainsScreen` et de `useRechercheTerrains` (`position`, `setPosition`). Web : API Geolocation native du navigateur, aucune dépendance. Mobile : nouvelle dépendance `expo-location` (permission + `getCurrentPositionAsync`). **Bug évité et documenté** : `search()` accepte maintenant une position en override plutôt que de compter sur `setPosition` + relecture immédiate de l'état — un `useCallback` mémoïsé aurait capturé l'ancienne valeur de position dans sa closure (React ne re-rend qu'après ce tour de code), d'où le paramètre explicite. Distance affichée dans les résultats quand le backend la renvoie (`distanceKm`). Tests écrits mais non exécutés. Dépend du géocodage/tri PostGIS côté backend (architecture.md section 4), pas encore implémenté. |
| US-10 | ✅ Fait (30 août 2026) | Nouveau package `packages/reservation-core/` (`useReserverCreneau`, `useCountdown`). Bouton `ReserverCreneauBouton` (web + mobile) ajouté à l'écran de détail d'annonce (US-08) — placé dans `modules/recherche/components` plutôt que dans un module Réservation à part entière, faute d'écran dédié pour l'instant (juste un bouton greffé sur un écran d'un autre module). **Réserver exige une session** (contrairement à US-07/US-08, publiques) — invite à se connecter sinon. **Hypothèse d'architecture documentée** : `Reservation.expireA` n'est pas un champ de l'entité RESERVATION dans `architecture.md` (id, creneau_id, joueur_id, statut, montant, created_at seulement) ; le backend peut le dériver de `created_at` + une durée fixe de verrou sans changement de schéma, donc pas de correctif d'architecture nécessaire ici (contrairement à l'écart des sports pratiqués, US-03, qui lui bloquait vraiment). Compte à rebours affiché en direct (mm:ss), recalculé depuis l'horloge système à chaque tick pour éviter une dérive. Le passage au paiement (US-11 à US-13) n'est pas déclenché — pas encore implémenté. Tests écrits mais non exécutés. Dépend de l'endpoint backend `/api/reservations` (POST), pas encore implémenté côté Laravel. |
| US-11 | ✅ Fait (30 août 2026) | Nouveau hook `useReservationStatus` dans `packages/reservation-core/` — interroge périodiquement (`/api/reservations/:id`, toutes les 4s) le statut d'une réservation jusqu'à un état terminal (`confirmee`/`annulee`), faute de canal temps réel dans `architecture.md` (pas de WebSocket). `ReserverCreneauBouton` (web + mobile) affiche maintenant trois états dynamiques après verrouillage : en attente (compte à rebours, US-10), confirmée (✅), ou annulée. **Cadrage volontaire** : ce ticket construit uniquement la détection/l'affichage de la confirmation — le déclenchement réel d'un paiement (Wave/Orange Money/Moov Money) n'existe pas encore et reste un `// TODO` explicite dans le code, à couvrir par US-12 à US-14. Marge de grâce de 30s après l'expiration du verrou avant d'arrêter le polling, pour laisser le temps à un webhook tardif de l'opérateur d'être traité côté backend. Tests écrits mais non exécutés (dont la transition vers "confirmée"/"annulée" simulée par un compteur d'appels sur le mock `fetch`). |
| US-12 | ✅ Fait (30 août 2026) | Nouveau package `packages/paiement-core/` (`useInitierPaiement`), avec un type `Operateur` couvrant déjà les trois opérateurs (Wave/Orange Money/Moov Money) même si seul Wave est câblé côté UI — l'"adaptateur de paiement commun" d'`architecture.md` se traduit ici par un composant `PaiementOperateurBouton` générique, réutilisable tel quel pour US-13/US-14 (changer juste `operateur`). **Décision UX ancrée dans le texte de RF-011** ("payer... sans sortir de l'application") : web ouvre le checkout Wave dans un **nouvel onglet** plutôt qu'une redirection complète (`window.location.href` aurait fait quitter l'app) ; mobile utilise **`expo-web-browser`** (navigateur intégré façon SFSafariViewController/Custom Tab) plutôt que `Linking.openURL` (qui basculerait vers un navigateur externe, sortant réellement de l'app) — nouvelle dépendance native, mais seule option cohérente avec l'exigence. Le bouton s'ajoute à l'état "en attente" déjà construit à US-11 ; la confirmation elle-même reste détectée par le polling existant (US-11), ce ticket ne fait qu'initier le paiement et ouvrir la page. Tests écrits mais non exécutés. Dépend de l'endpoint backend `/api/paiements` (POST) et du webhook Wave asynchrone (architecture.md section 4), pas encore implémentés côté Laravel. |
| US-13 | ✅ Fait (30 août 2026) | Aucun nouveau code de composant : `PaiementOperateurBouton` (US-12) était déjà générique, il suffisait d'ajouter `operateur="orange_money"` à la liste affichée dans `ReserverCreneauBouton`. Le joueur voit maintenant les trois boutons de paiement côte à côte ("Choisis ton moyen de paiement"). Test paramétré (`it.each`) ajouté pour vérifier explicitement que le composant générique fonctionne aussi pour Orange Money, pas seulement pour Wave. Dépend du même endpoint `/api/paiements` (paramétré par `operateur`), pas encore implémenté côté Laravel. |
| US-14 | ✅ Fait (30 août 2026) | Même changement qu'US-13, pour `operateur="moov_money"` — troisième et dernier bouton de la liste `OPERATEURS` (nouvel export de `packages/paiement-core/`). **Sprint 10 clos : les trois moyens de paiement Must have du PRD sont maintenant couverts.** Même test paramétré qu'US-13, mêmes réserves (endpoint backend non implémenté). |
| US-15 | ✅ Fait (30 août 2026) | **Écart d'architecture détecté et corrigé avant codage** : l'entité PAIEMENT n'avait aucun champ pour le reversement — ajout de `commission`, `montant_net`, `statut_reversement`, `date_reversement` dans `architecture.md` (section 3, correction du 30 août 2026), modélisés comme extension de PAIEMENT plutôt qu'une entité REVERSEMENT séparée (pas d'exigence de regroupement de plusieurs paiements en un seul virement pour l'instant). Contrairement à `Reservation.expireA` (US-10, dérivable sans stockage), ces champs représentent de vraies décisions métier (taux de commission, statut) sans lieu où exister avant cette correction — traité comme l'écart des sports pratiqués (US-03), pas comme une simple hypothèse frontend. **Frontend construit en lecture seule** : `ReversementsList`/`ReversementsScreen` (page `/reversements` web) affichent montant brut, commission, montant net et statut — aucun bouton d'action, le reversement étant un processus backend automatique selon un cycle défini (RF-015), pas une action déclenchée par l'utilisateur. **Sprint 11 clos : le module Paiement est maintenant entièrement couvert (US-11 à US-15).** Tests écrits mais non exécutés. Dépend de l'endpoint backend `/api/reversements` (GET), pas encore implémenté côté Laravel. |
| US-16 | ✅ Fait (30 août 2026) | Nouveau package `packages/notation-core/` (`useNoterSession`, note 1-5 requise + commentaire optionnel — RF-016). Web : `NotationForm` (page `/reservations/[reservationId]/noter/[cibleId]`) ; mobile : `NotationScreen`. **Même limite que ReserverCreneauBouton avant US-08** : `reservationId`/`cibleId` passés en props/route faute d'écran "historique des réservations" (US-18/US-19, sprint suivant) d'où naviguer depuis une vraie liste de sessions passées. Tests écrits mais non exécutés. Dépend de l'endpoint backend `/api/notations` (POST), pas encore implémenté — le commentaire du code souligne que c'est au backend de vérifier que l'auteur et la cible étaient bien tous deux parties à la réservation avant d'accepter la notation. |
| US-17 | ✅ Fait (30 août 2026) | `NoteMoyenneBadge` (web + mobile), nouveau hook `useNoteMoyenne` dans `packages/notation-core/` — **volontairement public** (aucun token), comme la recherche/consultation d'annonce (US-07/US-08). Composant autonome (charge sa propre donnée via `utilisateurId`), embarqué pour l'instant dans `NotationForm`/`NotationScreen` (US-16) faute d'écran "profil public" où l'accueillir autrement — prêt à être réutilisé tel quel le jour où un tel écran existera. **Sprint 12 clos : le module Notation & Réputation est entièrement couvert.** Tests écrits mais non exécutés. Dépend de l'endpoint backend `/api/utilisateurs/:id/note` (GET), pas encore implémenté côté Laravel. |
| US-18 | ✅ Fait (30 août 2026) | Nouveau package `packages/historique-core/` — un seul type (`HistoriqueReservation`) et un seul hook (`useHistorique`, paramétré par `role: 'joueur' \| 'proprietaire'`) pour US-18 ET US-19, les deux vues étant structurellement identiques (réutilise `Sport` de `@app/shared` et `ReservationStatut` de `@app/reservation-core` plutôt que de les redéfinir). Web : `HistoriqueList` (pages `/historique/joueur` et `/historique/proprietaire`) ; mobile : `HistoriqueScreen`. **Boucle refermée avec US-16** : `estSessionTerminee()` (documentée — RESERVATION.statut n'a pas de valeur "terminée" dédiée dans le modèle, dérivée de `statut === 'confirmee'` + fin de créneau passée) fait apparaître un lien "Noter cette session" vers l'écran de notation, avec de vrais `reservationId`/`cibleId` cette fois — plus besoin de les saisir à la main. Tests écrits mais non exécutés (dont un test paramétré vérifiant que le lien "Noter" n'apparaît que pour les sessions passées et confirmées). Dépend des endpoints backend `/api/reservations/mes-reservations` et `/api/reservations/recues`, pas encore implémentés côté Laravel. |
| US-19 | ✅ Fait (30 août 2026) | Même livraison qu'US-18 — un seul composant (`HistoriqueList`/`HistoriqueScreen`) couvre les deux user stories via le paramètre `role`. **Sprint 13 clos.** |
| US-20 | ✅ Fait (30 août 2026) | **Écart d'architecture détecté et corrigé avant codage** : aucune entité NOTIFICATION n'existait dans le modèle de données — ajoutée (destinataire_id, reservation_id, type, titre, message, lue, created_at) avec `UTILISATEUR.push_tokens` (JSON, même pattern que `sports_pratiques`), correction du 30 août 2026. Nouveau package `packages/notification-core/` (`useNotifications` : liste + marquage lu). **Un seul mécanisme pour US-20 et US-21** : les deux user stories partagent la même exigence RF-020 et ne diffèrent que par le `type` de la notification affichée (`confirmation_reservation` vs `rappel_creneau`). Web : `NotificationsList` (page `/notifications`). L'envoi réel (push/email/SMS) reste backend ; ce module ne fait qu'afficher le journal déjà envoyé. Tests écrits et exécutés (`npm test`), verts. Dépend des endpoints backend `/api/notifications` (GET) et `/api/notifications/:id/lue` (PATCH), pas encore implémentés côté Laravel. |
| US-21 | ✅ Fait (30 août 2026) | Même livraison qu'US-20 (mécanisme partagé) + **spécificité mobile** : nouveau hook `usePushRegistration` (`packages/notification-core` + `mobile/.../hooks/`) qui demande la permission et enregistre le jeton `expo-notifications` de l'appareil auprès du backend — sans quoi aucun push FCM n'est délivrable, même si le backend en génère un. Nouvelle dépendance `expo-notifications`. Non pertinent côté web (l'architecture ne prévoit pas de web push, seulement FCM mobile + email/SMS qui n'exigent aucune action du frontend web). **Limite assumée** : l'enregistrement se déclenche en visitant l'écran "Mes notifications", pas globalement à la connexion, faute de routeur applicatif en place (même limite que d'autres écrans du projet). **Sprint 14 clos — premier Should have livré.** Tests écrits et exécutés, verts (mock de `expo-notifications` inclus). Dépend de l'endpoint backend `/api/utilisateurs/moi/push-tokens` (POST), pas encore implémenté côté Laravel. |
| US-22 | ✅ Fait (30 août 2026) | **Aucun écart d'architecture cette fois** (vérifié avant de coder) : `RESERVATION.statut` et `PAIEMENT.statut` sont déjà des champs `string` ouverts dans le modèle de données, 'annulee' existait déjà comme valeur possible du premier — une annulation/remboursement n'est donc qu'une transition de statut sur des champs déjà modélisés, pas une donnée sans nulle part où être stockée (contrairement à US-03/US-15/US-20/US-21). Extension de `packages/reservation-core/` (`annulerReservation`, `useAnnulerReservation`) + nouveau helper `estReservationAnnulable` dans `packages/historique-core/`. Câblé dans l'historique joueur déjà construit à US-18 (`HistoriqueList` web, `HistoriqueScreen` mobile) : un bouton "Annuler ma réservation" apparaît uniquement côté joueur, sur une réservation confirmée dont le créneau n'a pas encore commencé. **Le frontend ne décide jamais si le "délai limite" du RF-021 est respecté** — il propose l'action puis affiche tel quel le message renvoyé par le backend (remboursé ou non), et met à jour la ligne concernée localement sans re-fetch complet (même pattern que le marquage lu des notifications, US-20). Tests écrits et exécutés, verts. Dépend de l'endpoint backend `/api/reservations/:id/annulation` (POST), pas encore implémenté côté Laravel — en particulier la politique de délai elle-même, qui reste à définir précisément côté métier/backend. |
| US-23 | ✅ Fait (30 août 2026) | Extension de `packages/recherche-core/` : `RechercheFiltres` gagne `prixMax`/`distanceMaxKm`/`equipements`, tous les trois filtrant des champs déjà modélisés (`CRENEAU.tarif`, la distance déjà calculée pour `distanceKm` depuis US-09, `TERRAIN.equipements`) — **aucun écart d'architecture** non plus ici, même raisonnement qu'US-22. `RechercheResultat` gagne aussi un champ `equipements` (projection de `TERRAIN.equipements`, déjà présent dans `TerrainDetail` depuis US-08 mais pas encore dans les résultats de liste) pour que l'utilisateur voie pourquoi un résultat correspond au filtre. Réutilise `EQUIPEMENT_OPTIONS`/`Equipement` déjà dans `@app/shared` (pas de redéfinition). **Le filtre de distance max est désactivé tant qu'aucune position (US-09) n'est renseignée** — actionnable uniquement après avoir cliqué "Trier par proximité", avec message explicatif. Web (`SearchTerrains`) + Mobile (`SearchTerrainsScreen`) mis à jour en parallèle, même hook partagé `useRechercheTerrains`. Tests écrits et exécutés, verts. **Sprints 15 et 16 clos.** Dépend de l'implémentation réelle du filtrage (prix/distance/équipements) côté endpoint backend `/api/recherche/terrains`, pas encore implémenté côté Laravel. |
