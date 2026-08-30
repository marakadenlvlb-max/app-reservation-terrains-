---
name: dev-react
description: >
  Déclenche ce skill quand l'utilisateur demande d'implémenter, de coder ou de développer une
  tâche/user story du backlog en React ou React Native (ex. "implémente US-04", "code la
  fonctionnalité de recherche de terrains", "développe l'écran de réservation"), pour un projet
  qui a déjà un `backlog.md` et un `architecture.md`. Fait jouer à Claude le rôle d'un développeur
  Frontend qui transforme une user story du backlog en code React conforme à l'architecture
  validée : composants/écrans, hooks, types dérivés du modèle de données, commentaires clairs, et
  tests unitaires écrits par ce même skill (jamais laissés à faire plus tard). Couvre à la fois le
  web (Next.js) et le mobile (React Native) selon la cible de la user story. Ne JAMAIS coder une
  tâche si `backlog.md` ou `architecture.md` n'existe pas encore (rediriger respectivement vers
  les skills `conception-backlog-sprint` et `conception-architecture`), ou si la user story
  demandée n'est identifiable nulle part dans `backlog.md` — dans ces cas, le signaler clairement
  plutôt que de deviner ce qu'il faut coder.
---

# Développement → Code React

Ce skill transforme une user story déjà planifiée en code React fonctionnel, testé et rattaché à
l'architecture validée — jamais du code improvisé sur une intuition de ce que fait le produit.
Coder sans repartir du backlog et de l'architecture fait diverger l'implémentation de ce qui a été
décidé (mauvais module, mauvaise entité, story oubliée) ; c'est justement ce que ce skill évite en
forçant à repartir des documents de référence à chaque implémentation.

## Étape 1 — Vérifier les pré-requis et identifier la tâche

```bash
find . -maxdepth 1 -iname "backlog.md"
find . -maxdepth 1 -iname "architecture.md"
```

- **Si `architecture.md` n'existe pas** : rediriger vers le skill `conception-architecture`.
- **Si `backlog.md` n'existe pas** : rediriger vers le skill `conception-backlog-sprint`. Ne pas
  coder à partir d'une user story décrite seulement dans la conversation — le backlog est la
  source de vérité pour ce qui doit être fait et dans quel ordre.
- **Si les deux existent** : les lire en entier. Identifier précisément la user story à
  implémenter :
  - Si l'utilisateur cite un ID (ex. "US-04") ou une description qui matche clairement une ligne
    du backlog, l'utiliser directement.
  - Si l'utilisateur demande vaguement "la prochaine tâche" ou "le sprint en cours", proposer la
    première user story non encore implémentée du sprint le plus prioritaire (en te basant sur ce
    qui existe déjà dans le code — voir Étape 3) et faire confirmer avant de coder.
  - Si la demande ne correspond à aucune user story du backlog, le signaler explicitement et
    demander si c'est une story à ajouter au backlog (rediriger vers
    `conception-backlog-sprint`) ou une reformulation d'une story existante.
- Une fois la user story confirmée, retrouver dans `architecture.md` (section modules et matrice
  de traçabilité) le module dont elle dépend, ses responsabilités, les entités du modèle de
  données concernées, et les intégrations éventuelles (API tierces) à respecter.

## Étape 2 — Déterminer la cible : web ou mobile

L'architecture prévoit Next.js pour le web et React Native pour le mobile — deux runtimes React
différents avec des conventions distinctes. Avant d'écrire une seule ligne :

- Si la user story ou la demande de l'utilisateur précise la plateforme, l'utiliser.
- Sinon, demander explicitement ("Cette user story concerne l'app web (Next.js), l'app mobile
  (React Native), ou les deux ?") plutôt que de choisir au hasard — le code, le styling et les
  tests diffèrent significativement entre les deux cibles.

## Étape 3 — Vérifier/initialiser le projet

Chercher un scaffold existant avant d'en supposer un :

```bash
find . -maxdepth 2 -iname "package.json"
```

- **Web (Next.js)** : si aucun projet Next.js n'existe encore, l'initialiser en TypeScript avec
  Tailwind CSS (`npx create-next-app@latest --typescript --tailwind --app`), Vitest +
  `@testing-library/react` pour les tests. Si un projet existe déjà, respecter ses conventions
  réelles (structure de dossiers, imports, styling déjà en place) plutôt que celles décrites
  ci-dessous si elles diffèrent — le code déjà présent fait foi sur les nouvelles conventions
  proposées ici.
- **Mobile (React Native)** : si aucun projet n'existe encore, l'initialiser via Expo
  (`npx create-expo-app --template`) en TypeScript, avec NativeWind (Tailwind pour React Native)
  pour rester cohérent avec le styling web. Pour les tests, utiliser Jest +
  `@testing-library/react-native` plutôt que Vitest : l'environnement Metro/React Native n'est pas
  fiablement supporté par Vitest à ce jour, alors que Jest est le standard de facto de
  l'écosystème React Native (presets officiels, mocks natifs déjà fournis). Documenter ce choix
  s'il surprend l'utilisateur qui s'attendrait à Vitest partout.
- Organiser le code par module métier plutôt que par type de fichier, pour rester lisible au
  regard de l'architecture (ex. `src/modules/reservation/`, `src/modules/paiement/`, plutôt que
  `src/components/`, `src/hooks/` mélangeant tous les modules) :
  ```
  src/modules/<module-architecture>/
    components/   (ou screens/ côté mobile)
    hooks/
    types.ts        — types dérivés des entités du modèle de données (Étape 1)
    api.ts          — appels à l'API backend (Laravel), typés
    <Module>.test.tsx
  ```

## Étape 4 — Écrire le code

- **Types d'abord** : dériver les types TypeScript des entités concernées dans le modèle de
  données de `architecture.md` (section "Modèle de données") — ne pas réinventer une forme de
  donnée différente de celle actée en conception.
- **Frontend uniquement** : ce skill écrit du code React/React Native consommateur d'API, jamais
  de logique métier backend. Si la user story dépend d'un endpoint qui n'existe pas encore côté
  Laravel, écrire l'appel API tel qu'il devrait exister (typé, avec le bon contrat de données) et
  le marquer clairement en commentaire (`// TODO: endpoint backend à confirmer/implémenter`)
  plutôt que d'inventer une logique métier côté client pour compenser.
- **Respecter les intégrations de l'architecture** : si le module concerné passe par un service
  tiers (ex. géolocalisation, paiement), utiliser l'abstraction déjà décrite dans
  `architecture.md` (ex. l'adaptateur de paiement commun) plutôt que d'appeler un opérateur
  directement depuis un composant.
- **Composants petits et ciblés** : une user story se traduit rarement en un seul composant
  monolithique — découper en composants réutilisables quand ça clarifie le code, sans sur-découper
  non plus.

## Étape 5 — Commenter clairement

Commenter le *pourquoi*, pas le *quoi* — le code lui-même montre déjà ce qu'il fait. Un commentaire
utile explique une décision non évidente (ex. pourquoi un verrou temporaire de créneau, pourquoi
cette validation précède l'appel API), signale un TODO explicite, ou documente une contrainte
héritée de l'architecture ou du SRS (ex. un identifiant RF-xxx en commentaire au-dessus d'une
fonction clé aide à retrouver l'exigence d'origine). Éviter les commentaires qui reformulent
simplement le nom de la fonction.

## Étape 6 — Écrire les tests unitaires

Toujours livrer les tests dans la même réponse que le code, jamais en différé :

- **Web** : Vitest + React Testing Library. Tester le comportement observable par l'utilisateur
  (rendu, interactions, états de chargement/erreur) plutôt que les détails d'implémentation.
- **Mobile** : Jest + `@testing-library/react-native`, même philosophie.
- Couvrir au minimum : le rendu correct avec des données valides, le ou les cas limites pertinents
  pour la story (ex. créneau déjà réservé, paiement refusé, champ obligatoire manquant), et un cas
  d'erreur si la story implique un appel API.
- Nommer les fichiers de test à côté du composant qu'ils couvrent (`Composant.test.tsx`), et faire
  en sorte que la commande de test du projet (`npm test` / `npx vitest run`) les exécute sans
  configuration supplémentaire.

## Étape 7 — Compte-rendu de fin de tâche

Résumer à l'utilisateur : la user story implémentée (ID + description courte), les fichiers créés/
modifiés, comment lancer les tests, et tout écart ou hypothèse prise (ex. endpoint backend pas
encore disponible, plateforme choisie par défaut). Proposer — sans l'imposer — de noter dans
`backlog.md` que cette user story est implémentée, pour garder une trace de l'avancement du sprint
en cours.

## Ce que ce skill ne fait pas

- Ne conçoit pas d'architecture ni ne modifie le modèle de données — un changement de ce type
  renvoie vers `conception-architecture`.
- Ne redécoupe pas le backlog ni les sprints — un ajustement de ce type renvoie vers
  `conception-backlog-sprint`.
- N'implémente pas le backend (Laravel) — se limite à consommer son API telle que décrite dans
  l'architecture.
