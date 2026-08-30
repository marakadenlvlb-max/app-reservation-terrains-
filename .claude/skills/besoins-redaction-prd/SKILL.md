---
name: besoins-redaction-prd
description: >
  Déclenche ce skill dès que l'utilisateur décrit une nouvelle idée d'application, de produit
  ou de fonctionnalité en langage libre (même vague, même sans dire "PRD" ou "cahier des
  charges") et qu'aucun fichier prd.md n'existe encore à la racine du projet pour ce besoin.
  Fait jouer à Claude le rôle d'un Product Owner qui transforme un besoin brut — une phrase,
  un pitch, une liste de contraintes en vrac — en un PRD (Product Requirements Document)
  structuré : contexte/objectif, fonctionnalités essentielles priorisées (MoSCoW), contraintes
  connues, hors scope V1, critères de succès. Toujours vérifier l'existence de prd.md avant de
  se déclencher ; s'il existe déjà, proposer de le mettre à jour plutôt que de repartir de zéro.
  Utiliser ce skill même pour des demandes qui semblent petites ("je veux faire une app pour
  suivre mes dépenses", "j'ai une idée de site pour...") — c'est justement quand le besoin est
  informel que la structuration en PRD apporte le plus de valeur.
---

# Besoins → Rédaction PRD

Ce skill transforme un besoin exprimé en langage libre en un PRD (Product Requirements
Document) structuré et actionnable. Le but n'est pas de faire de la paperasse : un PRD clair
évite les allers-retours plus tard (mauvaise fonctionnalité construite, portée qui dérive,
critère de succès flou). Prendre le temps de bien poser les bases maintenant fait gagner du
temps ensuite.

## Étape 1 — Vérifier qu'un PRD n'existe pas déjà

Avant de poser la moindre question, vérifier si `prd.md` existe déjà à la racine du projet :

```bash
find . -maxdepth 1 -iname "prd.md"
```

- **S'il n'existe pas** : continuer normalement avec l'Étape 2.
- **S'il existe déjà** : le lire, résumer à l'utilisateur ce qu'il contient déjà, et demander
  s'il veut (a) le mettre à jour avec ce nouveau besoin, (b) le laisser tel quel, ou (c) repartir
  de zéro. Ne jamais écraser un PRD existant sans confirmation explicite.

## Étape 2 — Recueillir les besoins bruts

Partir de ce que l'utilisateur a déjà dit dans la conversation — ne jamais redemander une info
déjà donnée. Un PRD complet répond à cinq questions ; combler uniquement les trous :

1. **Contexte et objectif** — Quel problème ça résout ? Pour qui (profil utilisateur cible) ?
   Pourquoi maintenant ?
2. **Fonctionnalités essentielles** — Qu'est-ce que l'utilisateur doit pouvoir faire ? Ce qui
   distingue le cœur du produit du "ce serait bien d'avoir".
3. **Contraintes connues** — Stack ou techno imposée, plateforme(s) cible(s) (web, mobile,
   iOS/Android), intégrations attendues (API, services tiers, outils comme n8n, Higgsfield...),
   contraintes de délai ou de budget si mentionnées.
4. **Hors scope V1** — Ce que le produit ne fera explicitement pas dans une première version,
   même si ça a été évoqué en passant. Le nommer clairement évite les malentendus plus tard.
5. **Critères de succès** — Comment saura-t-on que ce PRD a été respecté et que la V1 est
   réussie ? Idéalement des critères vérifiables (ex. "un utilisateur peut créer un compte et
   ajouter une dépense en moins de 3 clics"), pas juste "ça marche bien".

Poser uniquement les questions dont la réponse manque vraiment. Privilégier des questions à
choix (via l'outil de question) plutôt que des questions ouvertes quand c'est possible, pour
aller plus vite. Si l'utilisateur n'a pas d'avis sur un point secondaire (ex. plateforme cible
non précisée alors que le reste du besoin est clair), proposer une hypothèse raisonnable plutôt
que de bloquer sur une question mineure — mais toujours demander confirmation sur le contexte/
objectif et sur les fonctionnalités essentielles, qui sont la colonne vertébrale du PRD.

## Étape 3 — Rédiger le PRD

Écrire le fichier `prd.md` à la racine du projet, avec cette structure exacte :

```markdown
# PRD — [Nom du projet]

*Rédigé le [date]*

## 1. Contexte et objectif

[Le problème résolu, en une ou deux phrases. Le public cible / persona principal. Pourquoi ce
projet a de la valeur pour cet utilisateur.]

## 2. Fonctionnalités essentielles

### Must have (indispensable pour la V1)
- [Fonctionnalité 1 — description courte de ce que l'utilisateur peut faire]
- [Fonctionnalité 2]

### Should have (important mais pas bloquant)
- [...]

### Could have (si le temps/budget le permet)
- [...]

### Won't have (explicitement pas pour cette version — voir section Hors scope)

## 3. Contraintes connues

- **Technique** : [stack imposée, langages, frameworks, si précisé — sinon "aucune contrainte
  imposée, choix libre en phase de conception"]
- **Plateforme** : [web / mobile iOS / mobile Android / desktop / CLI...]
- **Intégrations** : [API tierces, services, outils à connecter]
- **Autres** : [délai, budget, contraintes légales/réglementaires si mentionnées]

## 4. Hors scope pour la V1

- [Élément explicitement exclu, avec une courte raison si utile]
- [...]

## 5. Critères de succès

- [Critère vérifiable 1]
- [Critère vérifiable 2]
```

Notes de rédaction :

- Utiliser le MoSCoW (Must/Should/Could/Won't) pour prioriser — cela force à trancher plutôt
  que de lister toutes les idées au même niveau d'importance. La section "Won't have" du
  paragraphe 2 peut simplement renvoyer à la section 4 plutôt que de dupliquer.
- Rester concis : un PRD utile tient sur une page ou deux. Le but est la clarté, pas
  l'exhaustivité bureaucratique.
- Écrire des critères de succès vérifiables (observables/mesurables), pas des vœux pieux.
  Si l'utilisateur ne fournit rien de précis, proposer 2-3 critères déduits des fonctionnalités
  "Must have" et les lui soumettre plutôt que de laisser la section vide.

## Étape 4 — Validation

Présenter le PRD rédigé (ou un résumé de ses sections clés) à l'utilisateur et attendre une
validation explicite ("ok", "valide", "c'est bon") avant de considérer le besoin comme
formalisé. Si l'utilisateur demande des changements, les appliquer et re-présenter le PRD mis à
jour — ne pas passer à autre chose (conception, implémentation...) tant que le PRD n'est pas
validé.
