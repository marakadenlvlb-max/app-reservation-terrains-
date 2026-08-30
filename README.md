# App de réservation de terrains de sport entre particuliers

Application web et mobile permettant à des particuliers et des gestionnaires de publier des
terrains de sport (foot, tennis, basket), et à des joueurs de rechercher un créneau, le réserver
et le payer via mobile money (Wave, Orange Money, Moov Money) — contexte Sénégal / Afrique de
l'Ouest.

## Documentation du projet

Le projet suit un pipeline SDLC complet, chaque document s'appuyant sur le précédent :

| Document | Contenu |
|----------|---------|
| [`prd.md`](./prd.md) | Vision produit, priorisation MoSCoW des fonctionnalités |
| [`srs.md`](./srs.md) | Exigences fonctionnelles (RF-xxx) et non fonctionnelles (RNF-xxx) |
| [`architecture.md`](./architecture.md) | Stack technique, modules, modèle de données (ER), intégrations, matrice de traçabilité |
| [`backlog.md`](./backlog.md) | Backlog Agile, découpage en sprints, suivi d'implémentation user story par user story |
| [`workflow.md`](./workflow.md) | Déroulé du processus de conception → développement suivi sur ce projet |

**État du backlog** : Must have, Should have et Could have (US-01 à US-26) sont tous
implémentés — voir la section 4 « Suivi d'implémentation » de `backlog.md` pour le détail de
chaque story et les écarts d'architecture corrigés en cours de route.

## Stack technique

- **Web** : Next.js 14 (App Router), TypeScript, Tailwind CSS, Vitest + React Testing Library
- **Mobile** : Expo (React Native), TypeScript, NativeWind, Jest + React Native Testing Library
- **Backend** : Laravel (API consommée par les deux frontends — non inclus dans ce dépôt, voir
  `architecture.md` pour le contrat d'API attendu)
- Logique métier partagée entre web et mobile via des packages `@app/*-core` (hooks headless :
  appels API + état, sans rendu), consommés par des composants (web) et écrans (mobile) distincts

## Structure du monorepo

Monorepo géré avec les [workspaces npm](https://docs.npmjs.com/cli/v10/using-npm/workspaces).

```
.
├── web/                    # Application Next.js
├── mobile/                 # Application Expo / React Native
├── packages/                # Logique métier partagée (headless), un package par module
│   ├── shared/              # Types transverses (Sport, Equipement...)
│   ├── auth-core/            # Authentification & Profils
│   ├── annonces-core/        # Annonces & Créneaux
│   ├── recherche-core/       # Recherche & Catalogue (+ recommandations)
│   ├── reservation-core/     # Réservation (+ annulation/remboursement)
│   ├── paiement-core/        # Paiement (Wave / Orange Money / Moov Money)
│   ├── notation-core/        # Notation & Réputation
│   ├── historique-core/      # Historique des réservations
│   ├── notification-core/    # Notifications (confirmation, rappels)
│   ├── messagerie-core/      # Messagerie in-app liée à une réservation
│   └── parrainage-core/      # Parrainage
├── prd.md / srs.md / architecture.md / backlog.md / workflow.md
└── .claude/skills/          # Skills du pipeline de conception/développement de ce projet
```

## Démarrage

```bash
# À la racine — installe web, mobile et tous les packages partagés d'un coup
npm install

# Web (Next.js, http://localhost:3000)
npm run dev --workspace web

# Mobile (Expo)
npm run start --workspace mobile
```

## Tests

```bash
# Web (Vitest)
npm test --workspace web

# Mobile (Jest)
npm test --workspace mobile
```

Chaque user story livrée est couverte par des tests côté web et mobile (voir `backlog.md` pour
le détail par story).

## Licence

Tous droits réservés — voir [`LICENSE`](./LICENSE). Ce code n'est pas open source : aucune
réutilisation, copie ou distribution n'est autorisée sans permission écrite du titulaire des droits.

## Notes importantes

- Le backend Laravel n'est **pas** inclus dans ce dépôt : les appels API des packages `@app/*-core`
  sont écrits contre le contrat attendu (voir `architecture.md`) mais commentés `TODO` là où
  l'endpoint réel reste à confirmer/implémenter côté backend.
- Plusieurs écrans passent des identifiants (ex. `reservationId`, `terrainId`) en props plutôt que
  de naviguer via un routeur applicatif complet côté mobile — limitation assumée et documentée au
  fil de `backlog.md`, à lever lors de la mise en place d'une navigation réelle (ex. React
  Navigation).
