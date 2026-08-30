# SRS — App de réservation de terrains de sport entre particuliers

*Rédigé le 22 août 2026, à partir du PRD validé (prd.md, rédigé le 21 août 2026, mis à jour le
22 août 2026 pour l'intégration des paiements mobile money)*

## 1. Exigences fonctionnelles

### Compte et profil

**RF-001 — Inscription joueur**
Le système doit permettre à un nouvel utilisateur de créer un compte (email ou téléphone +
mot de passe) et de renseigner son ou ses sports pratiqués (foot, tennis, basket).
User story : En tant que joueur, je veux créer un compte, afin de pouvoir réserver des créneaux.

**RF-002 — Connexion**
Le système doit permettre à un utilisateur inscrit de s'authentifier pour accéder à son compte.
User story : En tant qu'utilisateur, je veux me connecter, afin de retrouver mon profil et mes
réservations.

**RF-003 — Édition du profil**
Le système doit permettre à un utilisateur de modifier ses informations de profil (sports
pratiqués, ville, photo).
User story : En tant que joueur, je veux compléter mon profil, afin d'être identifiable par les
autres joueurs et propriétaires.

### Publication de terrains

**RF-004 — Publication d'une annonce par un particulier**
Le système doit permettre à un particulier propriétaire d'un terrain privé de publier une
annonce (sport, adresse, photos, tarif).
User story : En tant que particulier propriétaire d'un terrain, je veux publier une annonce,
afin de le rendre réservable par d'autres joueurs.

**RF-005 — Publication d'une annonce par un gestionnaire**
Le système doit permettre à un gestionnaire d'un terrain public ou associatif de publier une
annonce selon les mêmes modalités qu'un particulier (RF-004).
User story : En tant que gestionnaire d'un terrain associatif, je veux publier ses créneaux
disponibles, afin de les rendre réservables en ligne.

**RF-006 — Définition des créneaux et tarifs**
Le système doit permettre au propriétaire/gestionnaire d'une annonce de définir les créneaux
disponibles (date, heure, durée) et le tarif associé à chacun.
User story : En tant que propriétaire, je veux définir mes créneaux et leurs tarifs, afin de
contrôler quand et à quel prix mon terrain est réservable.

### Recherche et réservation

**RF-007 — Recherche par sport et localisation**
Le système doit permettre à un joueur de rechercher des terrains disponibles en filtrant par
sport et par localisation/proximité.
User story : En tant que joueur, je veux chercher un terrain de foot près de chez moi, afin de
trouver rapidement une option pertinente.

**RF-008 — Recherche par date et heure**
Le système doit permettre à un joueur de filtrer les résultats de recherche par date et plage
horaire souhaitées, en n'affichant que les créneaux réellement disponibles.
User story : En tant que joueur, je veux filtrer par créneau horaire, afin de ne voir que les
terrains libres au moment qui m'intéresse.

**RF-009 — Consultation d'une annonce**
Le système doit permettre à un joueur de consulter le détail d'une annonce (photos, tarif,
équipements, note moyenne du terrain/propriétaire) avant de réserver.
User story : En tant que joueur, je veux voir le détail d'un terrain avant de réserver, afin de
m'assurer qu'il correspond à mes attentes.

**RF-010 — Sélection et initiation d'une réservation**
Le système doit permettre à un joueur de sélectionner un créneau disponible et d'initier une
réservation, en verrouillant temporairement ce créneau le temps du paiement pour éviter une
double réservation.
User story : En tant que joueur, je veux réserver un créneau précis, afin de m'assurer qu'il
sera disponible au moment du paiement.

### Paiement

**RF-011 — Paiement via Wave**
Le système doit permettre à un joueur de régler une réservation via Wave.
User story : En tant que joueur utilisant Wave, je veux payer ma réservation directement dans
l'app, afin de finaliser ma réservation sans sortir de l'application.

**RF-012 — Paiement via Orange Money**
Le système doit permettre à un joueur de régler une réservation via Orange Money.
User story : En tant que joueur utilisant Orange Money, je veux payer ma réservation
directement dans l'app, afin de finaliser ma réservation sans sortir de l'application.

**RF-013 — Paiement via Moov Money**
Le système doit permettre à un joueur de régler une réservation via Moov Money.
User story : En tant que joueur utilisant Moov Money, je veux payer ma réservation directement
dans l'app, afin de finaliser ma réservation sans sortir de l'application.

**RF-014 — Confirmation de réservation**
Le système doit confirmer automatiquement la réservation et libérer le verrou temporaire du
créneau (RF-010) dès que le paiement est validé par l'opérateur de paiement ; en cas d'échec de
paiement, le créneau doit redevenir disponible.
User story : En tant que joueur, je veux une confirmation immédiate après paiement, afin d'être
certain que ma réservation est bien enregistrée.

**RF-015 — Reversement au propriétaire/gestionnaire**
Le système doit reverser le montant de la réservation (moins la commission éventuelle de la
plateforme) au propriétaire/gestionnaire du terrain selon un cycle de reversement défini.
User story : En tant que propriétaire, je veux être payé pour les créneaux réservés, afin de
rentabiliser mon terrain.

### Notation et historique

**RF-016 — Notation post-session**
Le système doit permettre à un joueur de noter un autre joueur (et/ou le terrain) après la
session, avec une note et un commentaire optionnel.
User story : En tant que joueur, je veux noter mon expérience après une session, afin d'aider
les futurs utilisateurs à faire confiance à la plateforme.

**RF-017 — Affichage de la note sur le profil**
Le système doit afficher la note moyenne d'un joueur (calculée à partir des notations reçues)
sur son profil, visible par les autres utilisateurs avant une réservation.
User story : En tant que joueur, je veux voir la note d'un partenaire potentiel, afin de décider
si je réserve avec lui en confiance.

**RF-018 — Historique des réservations (joueur)**
Le système doit permettre à un joueur de consulter l'historique de ses réservations passées et
à venir.
User story : En tant que joueur, je veux voir mes réservations passées et à venir, afin de
garder une trace de mon activité.

**RF-019 — Historique des réservations (propriétaire/gestionnaire)**
Le système doit permettre à un propriétaire/gestionnaire de consulter l'historique des
réservations reçues sur ses annonces.
User story : En tant que propriétaire, je veux voir qui a réservé mon terrain et quand, afin de
suivre mon activité et mes revenus.

### Should have

**RF-020 — Notifications de réservation**
Le système doit notifier le joueur et le propriétaire/gestionnaire à la confirmation d'une
réservation, et rappeler au joueur son créneau à l'approche de l'horaire réservé.

**RF-021 — Annulation et remboursement**
Le système doit permettre à un joueur d'annuler une réservation selon une politique de délai
définie, et déclencher le remboursement correspondant si l'annulation respecte ce délai.

**RF-022 — Filtres de recherche avancés**
Le système doit permettre de filtrer la recherche de terrains par prix, distance et équipements
(vestiaires, éclairage, surface).

### Could have

**RF-023 — Messagerie in-app**
Le système doit permettre un échange de messages entre un joueur et un propriétaire/gestionnaire
au sujet d'une réservation.

**RF-024 — Recommandations personnalisées**
Le système doit pouvoir suggérer des terrains à un joueur en fonction de son historique de
réservations.

**RF-025 — Programme de parrainage**
Le système doit permettre à un joueur de parrainer un autre utilisateur et de suivre les
bénéfices associés.

## 2. Exigences non fonctionnelles

### RNF-001 — Performance
Une recherche de terrains (RF-007/RF-008) doit retourner ses résultats en moins de 2 secondes
pour un catalogue actif allant jusqu'à 10 000 annonces. *(Valeur par défaut proposée en
l'absence de seuil chiffré dans le PRD — à confirmer.)*

### RNF-002 — Sécurité
Aucune donnée de paiement sensible ne doit être stockée en clair par l'application ; les
échanges avec les opérateurs Wave, Orange Money et Moov Money doivent transiter exclusivement
via leurs API/SDK officiels sur connexion chiffrée (TLS). Les données personnelles des
utilisateurs doivent être chiffrées au repos et en transit. L'authentification (RF-002) doit
protéger contre les attaques par force brute courantes (limitation du nombre de tentatives).

### RNF-003 — Compatibilité
- **Web** : dernières versions stables de Chrome, Firefox, Safari et Edge, en design
  responsive (mobile, tablette, desktop).
- **Mobile** : iOS 15+ et Android 10+, conformément à la cible web + mobile natif du PRD
  (section 3 — Contraintes).

### RNF-004 — Accessibilité
L'interface web doit viser le niveau WCAG 2.1 AA (contrastes suffisants, navigation au clavier,
libellés explicites sur les champs de formulaire et les boutons d'action critiques comme le
paiement). *(Niveau proposé par défaut — à confirmer selon le public cible réel.)*

### RNF-005 — Disponibilité
Le service de paiement et de réservation (chemin critique RF-010 à RF-015) doit viser une
disponibilité mensuelle d'au moins 99,5 %, les interruptions de service pouvant directement
empêcher une réservation ou un paiement. *(Valeur par défaut proposée — à confirmer.)*

## 3. Matrice de traçabilité

| ID SRS | Description courte | Fonctionnalité PRD correspondante | Priorité PRD |
|--------|---------------------|-------------------------------------|--------------|
| RF-001 | Inscription joueur | Création de compte et profil joueur | Must have |
| RF-002 | Connexion | Création de compte et profil joueur | Must have |
| RF-003 | Édition du profil | Création de compte et profil joueur | Must have |
| RF-004 | Publication d'annonce (particulier) | Publication d'une annonce de terrain | Must have |
| RF-005 | Publication d'annonce (gestionnaire) | Publication d'une annonce de terrain | Must have |
| RF-006 | Définition créneaux/tarifs | Publication d'une annonce de terrain | Must have |
| RF-007 | Recherche par sport/localisation | Recherche de terrains disponibles | Must have |
| RF-008 | Recherche par date/heure | Recherche de terrains disponibles | Must have |
| RF-009 | Consultation d'une annonce | Recherche de terrains disponibles | Must have |
| RF-010 | Sélection et initiation de réservation | Réservation d'un créneau avec paiement en ligne | Must have |
| RF-011 | Paiement Wave | Réservation d'un créneau avec paiement en ligne | Must have |
| RF-012 | Paiement Orange Money | Réservation d'un créneau avec paiement en ligne | Must have |
| RF-013 | Paiement Moov Money | Réservation d'un créneau avec paiement en ligne | Must have |
| RF-014 | Confirmation de réservation | Réservation d'un créneau avec paiement en ligne | Must have |
| RF-015 | Reversement propriétaire/gestionnaire | Réservation d'un créneau avec paiement en ligne | Must have |
| RF-016 | Notation post-session | Système de notation des joueurs | Must have |
| RF-017 | Affichage note sur profil | Système de notation des joueurs | Must have |
| RF-018 | Historique réservations (joueur) | Historique des réservations | Must have |
| RF-019 | Historique réservations (propriétaire) | Historique des réservations | Must have |
| RF-020 | Notifications | Notifications | Should have |
| RF-021 | Annulation et remboursement | Politique d'annulation / remboursement | Should have |
| RF-022 | Filtres avancés | Filtres avancés | Should have |
| RF-023 | Messagerie in-app | Messagerie in-app | Could have |
| RF-024 | Recommandations | Recommandations de terrains | Could have |
| RF-025 | Programme de parrainage | Programme de parrainage | Could have |
| RNF-001 | Performance recherche | Section 3 — Contraintes | — |
| RNF-002 | Sécurité paiement/données | Section 3 — Contraintes (intégrations paiement) | — |
| RNF-003 | Compatibilité plateformes | Section 3 — Contraintes (plateforme) | — |
| RNF-004 | Accessibilité | Section 1 — Contexte (public cible) | — |
| RNF-005 | Disponibilité | Section 3 — Contraintes (intégrations paiement) | — |

## 4. Hypothèses et dépendances externes

**Hypothèses**
- Wave, Orange Money et Moov Money exposent chacun une API ou un SDK d'intégration accessible
  aux développeurs tiers permettant de déclencher et confirmer un paiement depuis l'application.
- Les gestionnaires de terrains publics/associatifs sont disposés à saisir manuellement leurs
  créneaux dans l'application (pas d'intégration avec un système de réservation municipal
  existant prévue pour la V1).
- Les utilisateurs disposent d'un compte actif sur au moins un des trois opérateurs mobile money
  pour pouvoir payer.

**Dépendances externes**
- API/SDK de paiement Wave, Orange Money et Moov Money.
- Un service de géolocalisation/cartographie pour la recherche par proximité (RF-007).
- Un service d'envoi de notifications (push et/ou SMS et/ou email) pour RF-020.
