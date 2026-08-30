---
name: conception-backlog-sprint
description: >
  Déclenche ce skill quand l'utilisateur demande de planifier le développement, de découper le
  projet en tâches, de créer un backlog, d'organiser des sprints, ou plus généralement de
  "passer de la conception à la planification" d'un projet qui a déjà un architecture.md. Fait
  jouer à Claude le rôle d'un Product Owner / Scrum Master qui transforme une architecture
  validée en backlog Agile actionnable : user stories dérivées des modules et fonctionnalités de
  l'architecture, priorisées selon le MoSCoW déjà défini dans le PRD, découpage en sprints
  (objectif + user stories associées par sprint), estimation indicative de l'effort par user
  story, et une matrice de traçabilité reliant chaque user story au module d'architecture qu'elle
  implémente. Ne JAMAIS générer de backlog si architecture.md n'existe pas encore (rediriger vers
  le skill conception-architecture) ou si l'architecture n'a pas été explicitement validée par
  l'utilisateur — dans les deux cas, le signaler clairement plutôt que de planifier sur une
  architecture non stabilisée.
---

# Conception → Backlog & Sprints

Ce skill traduit une architecture déjà validée en plan de développement concret : quelles user
stories, dans quel ordre, réparties comment dans le temps. Planifier des sprints sur une
architecture qui bouge encore fait tout redécouper plus tard — d'où l'importance de vérifier que
l'architecture est stable avant de s'engager sur un découpage.

## Étape 1 — Vérifier les pré-requis avant toute planification

```bash
find . -maxdepth 1 -iname "architecture.md"
find . -maxdepth 1 -iname "prd.md"
```

- **Si `architecture.md` n'existe pas** : ne pas improviser un backlog à partir de ce qui a été
  dit dans la conversation. Expliquer qu'une architecture est le point de départ nécessaire, et
  proposer d'utiliser le skill `conception-architecture` d'abord (qui lui-même s'appuie sur
  `srs.md`).
- **Si `architecture.md` existe** : le lire en entier, puis demander explicitement à
  l'utilisateur de confirmer que cette version est bien la version validée à partir de laquelle
  planifier (par exemple : "Je vois une architecture datée du [date] pour [projet] — c'est bien
  la version validée sur laquelle je dois baser le backlog ?"). Ne jamais supposer qu'une
  architecture présente sur disque est validée simplement parce qu'elle existe.
  - Si l'utilisateur confirme → continuer à l'Étape 2.
  - Si l'utilisateur indique que l'architecture est encore en cours de révision → **ne pas
    produire le backlog**. Signaler que la planification attend une architecture validée, et
    proposer soit de la finaliser d'abord, soit d'attendre.
- **Si `prd.md` n'existe pas** (cas rare puisque l'architecture en découle normalement) : le
  signaler — sans lui, il n'y a pas de priorisation MoSCoW à reporter sur le backlog. Demander à
  l'utilisateur comment prioriser les user stories à défaut (ex. tout classer "Should have" par
  défaut, ou fournir une priorisation à la volée).
- **Si `prd.md` existe** : le lire pour en extraire la priorisation MoSCoW (Must/Should/Could/
  Won't have) des fonctionnalités — c'est elle qui guidera la priorisation des user stories et
  l'ordre des sprints.

## Étape 2 — Cadrer les paramètres de planification

Deux paramètres changent complètement la forme du backlog et n'ont pas de valeur par défaut
neutre : les imposer reviendrait à deviner à la place de l'utilisateur. Les demander explicitement
avant de rédiger quoi que ce soit (privilégier l'outil de question à choix pour aller vite) :

1. **Format d'estimation de l'effort** — ex. taille T-shirt (S/M/L), story points (suite
   Fibonacci : 1, 2, 3, 5, 8...), ou un autre format si l'utilisateur en a un. Présenter les
   options sans en pousser une par défaut.
2. **Durée de sprint et capacité d'équipe** — ex. sprints d'1 ou 2 semaines, taille de l'équipe
   ou nombre de développeurs disponibles si connu (ça conditionne combien de user stories entrent
   dans un sprint). Si l'utilisateur ne connaît pas sa capacité précise, une hypothèse simple
   ("1 développeur, sprints de 2 semaines") suffit du moment qu'elle est confirmée par lui.

Ne pas passer à l'Étape 3 tant que ces deux points n'ont pas de réponse claire.

## Étape 3 — Dériver les user stories des modules de l'architecture

Pour chaque module/composant listé dans `architecture.md`, dériver une ou plusieurs user stories
au format standard : *"En tant que [rôle], je veux [action] afin de [bénéfice]"*. Une
fonctionnalité un peu large se découpe en plusieurs stories plus petites plutôt que de rester une
story monolithique difficile à estimer ou à finir dans un seul sprint.

Reporter sur chaque user story la priorité MoSCoW de la fonctionnalité correspondante dans le PRD
(Étape 1). Si une story couvre plusieurs fonctionnalités de priorités différentes, retenir la
priorité la plus haute.

## Étape 4 — Découper en sprints

Ordonner les user stories par priorité MoSCoW (Must d'abord) puis par dépendances techniques
évidentes (ex. l'authentification avant les fonctionnalités qui en dépendent). Répartir dans des
sprints successifs en respectant la capacité définie à l'Étape 2 — un sprint surchargé n'est
qu'une promesse qu'on sait déjà intenable. Donner à chaque sprint un objectif en une phrase (ce
que l'équipe peut démontrer à la fin du sprint), pas juste une liste de tâches.

## Étape 5 — Matrice de traçabilité

Construire un tableau reliant chaque user story du backlog au module d'architecture qu'elle
implémente. Ça permet de vérifier que chaque module a bien des user stories associées, et
qu'aucune story n'existe sans ancrage dans l'architecture validée.

## Structure du fichier

Écrire le fichier `backlog.md` à la racine du projet, avec cette structure :

```markdown
# Backlog & Sprints — [Nom du projet]

*Rédigé le [date], à partir de l'architecture validée du [date de l'architecture]*
*Format d'estimation : [T-shirt S/M/L | Story points | autre] — Sprints de [durée], capacité :
[hypothèse retenue]*

## 1. Backlog

| ID | User story | Module (architecture) | Priorité (MoSCoW) | Estimation |
|----|-------------|--------------------------|----------------------|--------------|
| US-01 | En tant que ..., je veux ... afin de ... | [Module] | Must | [S/M/L ou points] |

## 2. Découpage en sprints

### Sprint 1 — [Objectif du sprint en une phrase]
| User story | Priorité | Estimation |
|-------------|-----------|--------------|
| US-01 | Must | [...] |

### Sprint 2 — [Objectif du sprint]
[même format]

## 3. Matrice de traçabilité

| User story | Module (architecture) |
|-------------|---------------------------|
| US-01 | [Module] |
```

Notes de rédaction :

- Garder les user stories petites et testables individuellement — une story qui ne tient pas
  dans un seul sprint doit être redécoupée plutôt que d'être forcée dedans.
- Si des user stories "Won't have" figurent dans le PRD, ne pas les inclure dans le backlog des
  sprints planifiés ; les lister à part en fin de document ("Hors backlog V1") pour mémoire.
- Rester cohérent avec le vocabulaire des modules de `architecture.md` (mêmes noms) pour que la
  matrice de traçabilité soit lisible sans effort de correspondance.

## Étape 6 — Validation

Présenter le backlog rédigé (ou un résumé : nombre de sprints, objectif de chacun, et le nombre
de user stories Must non couvertes s'il y en a) à l'utilisateur et attendre une validation
explicite avant de considérer le backlog comme figé — au même titre que pour le PRD, le SRS et
l'architecture. Si l'utilisateur ajuste un point (priorité, découpage de sprint, estimation),
corriger et re-présenter en s'assurant que la matrice de traçabilité reste cohérente avec le
changement.
