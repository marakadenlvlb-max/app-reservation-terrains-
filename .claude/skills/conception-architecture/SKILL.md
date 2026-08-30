---
name: conception-architecture
description: >
  Déclenche ce skill quand l'utilisateur demande de concevoir l'architecture technique, de
  proposer une stack, de définir les modules/composants ou le modèle de données, ou plus
  généralement de "passer à la conception" d'un projet qui a déjà un srs.md. Fait jouer à
  Claude le rôle d'un architecte logiciel qui transforme un SRS validé en un document
  d'architecture : stack technique (plusieurs options comparées et justifiées par rapport aux
  exigences non fonctionnelles du SRS), structure des modules/composants avec leurs
  responsabilités, modèle de données, choix d'intégration (APIs externes, services tiers) issus
  du SRS, et une matrice de traçabilité reliant chaque choix d'architecture aux exigences du SRS
  qu'il couvre. Ne JAMAIS proposer d'architecture si srs.md n'existe pas encore (rediriger vers
  le skill besoins-redaction-srs) ou si le SRS n'a pas été explicitement validé par
  l'utilisateur — dans les deux cas, le signaler clairement plutôt que de concevoir sur des
  exigences non stabilisées.
---

# Conception → Architecture

Ce skill traduit un SRS déjà validé en décisions de conception concrètes : quelle stack, quels
modules, quel modèle de données, quelles intégrations. Une architecture décidée sur des
exigences qui bougent encore coûte cher à revoir — d'où l'importance de vérifier que le SRS est
stable avant de s'engager sur des choix techniques.

## Étape 1 — Vérifier les pré-requis avant toute conception

```bash
find . -maxdepth 1 -iname "srs.md"
```

- **Si `srs.md` n'existe pas** : ne pas improviser une architecture à partir de ce qui a été dit
  dans la conversation. Expliquer qu'un SRS est le point de départ nécessaire, et proposer
  d'utiliser le skill `besoins-redaction-srs` d'abord (qui lui-même s'appuie sur `prd.md`).
- **Si `srs.md` existe** : le lire en entier, puis demander explicitement à l'utilisateur de
  confirmer que cette version est bien la version validée à partir de laquelle concevoir (par
  exemple : "Je vois un SRS daté du [date] pour [projet] — c'est bien la version validée sur
  laquelle je dois baser l'architecture ?"). Ne jamais supposer qu'un SRS présent sur disque est
  validé simplement parce qu'il existe.
  - Si l'utilisateur confirme → continuer à l'Étape 2.
  - Si l'utilisateur indique que le SRS est encore en cours de révision → **ne pas produire le
    document d'architecture**. Signaler que la conception attend un SRS validé, et proposer soit
    de le finaliser d'abord, soit d'attendre.

## Étape 2 — Stack technique : comparer avant de recommander

Pour chaque couche pertinente au projet (backend, frontend/mobile, base de données,
hébergement/infra si pertinent), comparer 2 à 3 options réalistes plutôt que d'en imposer une
seule d'emblée — l'utilisateur doit pouvoir voir *pourquoi* une option l'emporte, pas seulement
laquelle. Justifier chaque option par rapport aux exigences non fonctionnelles du SRS
(performance, sécurité, compatibilité, accessibilité, disponibilité...) et aux contraintes déjà
actées (plateformes cibles, intégrations imposées). Terminer par une recommandation claire, puis
**demander à l'utilisateur de confirmer ou d'ajuster ce choix** avant de la considérer comme
retenue dans le reste du document — la stack conditionne tout ce qui suit (modules, modèle de
données), donc ce point mérite un accord explicite plutôt qu'une hypothèse silencieuse.

## Étape 3 — Structure des modules/composants

Regrouper les exigences fonctionnelles du SRS en modules cohérents (ex. Authentification,
Recherche/Catalogue, Réservation, Paiement, Notation, Notifications) plutôt que de créer un
module par exigence individuelle — l'objectif est une découpe qu'un développeur peut coder et
faire évoluer indépendamment. Pour chaque module, préciser sa responsabilité en une phrase.

Représenter la structure globale (modules + relations/flux principaux) avec un diagramme
Mermaid (`graph TD` ou équivalent) — ça rend la vue d'ensemble immédiatement lisible, en plus du
tableau des responsabilités.

## Étape 4 — Modèle de données

Si le projet manipule des données structurées persistantes (ce qui est le cas de la grande
majorité des projets applicatifs), définir les entités principales, leurs attributs clés et
leurs relations. Représenter le tout avec un diagramme Mermaid `erDiagram`. Si le SRS décrit un
projet sans état/données à modéliser (ex. un script utilitaire sans persistance), le dire
explicitement plutôt que d'inventer un modèle de données qui ne sert à rien.

## Étape 5 — Choix d'intégration

Reprendre les dépendances externes et intégrations listées dans le SRS (section "Hypothèses et
dépendances externes" et les exigences qui mentionnent des services tiers) et préciser, pour
chacune, comment elle s'intègre concrètement dans l'architecture (quel module l'utilise, quel
protocole/SDK, quelles implications de sécurité ou de disponibilité).

## Étape 6 — Matrice de traçabilité

Construire un tableau reliant chaque choix d'architecture (stack retenue, module, entité de
données, intégration) aux exigences du SRS (`RF-xxx` / `RNF-xxx`) qu'il couvre. Ça permet de
vérifier que chaque exigence a bien une réponse architecturale, et qu'aucun choix n'a été fait
sans justification traçable au SRS.

## Structure du fichier

Écrire le fichier `architecture.md` à la racine du projet, avec cette structure :

```markdown
# Architecture — [Nom du projet]

*Rédigé le [date], à partir du SRS validé du [date du SRS]*

## 1. Stack technique

### Backend
| Option | Avantages | Inconvénients | Exigences couvertes |
|--------|-----------|----------------|----------------------|
| [Option A] | ... | ... | RNF-xxx |
| [Option B] | ... | ... | RNF-xxx |

**Recommandation** : [Option retenue] — [justification courte liée aux RNF/contraintes]

### Frontend / Mobile
[même format]

### Base de données
[même format]

### Hébergement / Infrastructure
[même format, si pertinent]

## 2. Structure des modules/composants

```mermaid
graph TD
    [Diagramme des modules et de leurs interactions principales]
```

| Module | Responsabilité | Exigences couvertes |
|--------|------------------|----------------------|
| [Module A] | ... | RF-xxx, RF-xxx |

## 3. Modèle de données

```mermaid
erDiagram
    [Entités, attributs clés et relations]
```

## 4. Choix d'intégration

| Intégration | Utilisée par (module) | Détails techniques | Exigence(s) source |
|-------------|-------------------------|----------------------|----------------------|
| [API/service tiers] | ... | ... | RF-xxx |

## 5. Matrice de traçabilité

| Choix d'architecture | Exigence(s) SRS couverte(s) |
|------------------------|--------------------------------|
| Stack backend : [...] | RNF-xxx |
| Module [...] | RF-xxx, RF-xxx |
| Entité [...] | RF-xxx |
| Intégration [...] | RF-xxx |
```

## Validation

Présenter le document (ou un résumé de ses sections, en particulier la stack recommandée et la
structure des modules) et attendre une validation explicite avant de considérer la conception
comme figée — au même titre que pour le PRD et le SRS. Si l'utilisateur ajuste un choix (ex.
une autre base de données, un module à fusionner), corriger et re-présenter en s'assurant que la
matrice de traçabilité reste cohérente avec le changement.
