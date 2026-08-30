# PRD — App de réservation de terrains de sport entre particuliers

*Rédigé le 21 août 2026*

## 1. Contexte et objectif

Aujourd'hui, trouver et réserver un terrain de sport (foot, tennis, basket) en dehors des
circuits classiques de club repose sur du bouche-à-oreille ou des groupes de messagerie
informels. Cette app connecte des particuliers qui ont accès à un terrain (privé, ou géré par
une structure publique/associative) avec des joueurs qui cherchent un créneau disponible près
de chez eux, avec paiement en ligne intégré et un système de réputation pour instaurer de la
confiance entre inconnus.

**Public cible** : particuliers pratiquant le foot, le tennis ou le basket en loisir, qui
veulent réserver un créneau simplement (côté joueur) ou rentabiliser/partager l'accès à un
terrain (côté propriétaire/gestionnaire).

## 2. Fonctionnalités essentielles

### Must have (indispensable pour la V1)
- Création de compte et profil joueur (identité de base, sport(s) pratiqué(s))
- Publication d'une annonce de terrain — par un particulier propriétaire d'un terrain privé,
  ou par un gestionnaire d'un terrain public/associatif — avec sport, adresse, photos, tarif,
  créneaux disponibles
- Recherche de terrains disponibles avec filtres (sport, localisation, date/heure)
- Réservation d'un créneau avec paiement en ligne au moment de la réservation
- Système de notation des joueurs après une session (note + commentaire optionnel), visible
  sur le profil
- Historique des réservations, à la fois côté joueur et côté propriétaire/gestionnaire

### Should have (important mais pas bloquant)
- Notifications (confirmation de réservation, rappel avant le créneau)
- Politique d'annulation / remboursement simple (ex. délai limite avant remboursement)
- Filtres avancés (prix, distance, équipements — vestiaires, éclairage, surface)

### Could have (si le temps/budget le permet)
- Messagerie in-app entre joueur et propriétaire/gestionnaire pour les questions liées à un
  créneau
- Recommandations de terrains selon l'historique du joueur
- Programme de parrainage

### Won't have (voir section 4 — Hors scope)

## 3. Contraintes connues

- **Technique** : aucune contrainte imposée — le choix de stack (web, mobile natif ou
  cross-platform) se fera en phase de conception.
- **Plateforme** : web (responsive) **et** application mobile (iOS + Android) dès la V1.
- **Intégrations** : paiement en ligne via mobile money — **Wave**, **Orange Money** et
  **Moov Money** — imposés comme moyens de paiement pour encaisser les réservations et reverser
  les propriétaires/gestionnaires. Le choix d'un agrégateur/API pour connecter ces trois
  opérateurs se fera en phase de conception.
- **Autres** : aucune contrainte de délai ou de budget communiquée à ce stade.

## 4. Hors scope pour la V1

- **Organisation de tournois ou de matchs multi-équipes** — la V1 se limite à la réservation
  simple d'un créneau entre particuliers, pas de gestion de compétition ou de brackets.

## 5. Critères de succès

- Un propriétaire/gestionnaire peut publier un terrain disponible (avec créneaux et tarif) en
  moins de 5 minutes.
- Un joueur peut trouver un créneau disponible pour son sport près de chez lui et le réserver
  en moins de 5 clics/écrans.
- Le paiement en ligne aboutit de bout en bout via **chacun** des trois moyens (Wave, Orange
  Money et Moov Money) dès la V1, et le montant est correctement crédité au
  propriétaire/gestionnaire (moins la commission éventuelle de la plateforme).
- Après une session, les deux parties peuvent noter l'autre joueur, et cette note apparaît sur
  le profil pour les réservations futures.
