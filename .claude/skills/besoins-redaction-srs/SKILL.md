---
name: besoins-redaction-srs
description: >
  Déclenche ce skill quand l'utilisateur demande de détailler les spécifications techniques,
  d'écrire un SRS (Software Requirements Specification), de "passer du PRD au technique", de
  lister les exigences fonctionnelles/non fonctionnelles, ou de préparer la base pour la
  conception/architecture d'un projet qui a déjà un prd.md. Fait jouer à Claude le rôle d'un
  Product Owner / Analyste qui transforme un PRD validé en un SRS détaillé : exigences
  fonctionnelles numérotées (RF-xxx) dérivées de chaque fonctionnalité du PRD, exigences non
  fonctionnelles (RNF-xxx : performance, sécurité, compatibilité, accessibilité), user stories
  associées à chaque exigence, matrice de traçabilité SRS ↔ PRD, et hypothèses/dépendances
  externes. Ne JAMAIS rédiger de SRS si prd.md n'existe pas encore (rediriger vers le skill
  besoins-redaction-prd) ou si le PRD n'a pas été explicitement validé par l'utilisateur —
  dans les deux cas, le signaler clairement plutôt que de produire un SRS sur des bases non
  confirmées.
---

# Besoins → Rédaction SRS

Ce skill prend le relais du PRD : là où le PRD dit *quoi* construire et *pour qui*, le SRS dit
*comment* ça doit se comporter, avec assez de précision pour qu'un architecte ou un développeur
puisse concevoir sans deviner. Un SRS n'a de valeur que s'il repose sur un besoin déjà stabilisé
— d'où l'importance de ne jamais sauter la vérification de l'Étape 1.

## Étape 1 — Vérifier les pré-requis avant toute rédaction

```bash
find . -maxdepth 1 -iname "prd.md"
```

- **Si `prd.md` n'existe pas** : ne pas improviser un SRS à partir de ce que l'utilisateur vient
  de dire dans la conversation. Expliquer qu'un PRD est le point de départ nécessaire, et
  proposer d'utiliser le skill `besoins-redaction-prd` d'abord.
- **Si `prd.md` existe** : le lire en entier, puis demander explicitement à l'utilisateur de
  confirmer que cette version est bien la version validée à partir de laquelle travailler (par
  exemple : "Je vois un PRD daté du [date] pour [projet] — c'est bien la version validée sur
  laquelle je dois baser le SRS ?"). Ne jamais supposer qu'un PRD présent sur disque est validé
  simplement parce qu'il existe.
  - Si l'utilisateur confirme → continuer à l'Étape 2.
  - Si l'utilisateur indique que le PRD est encore un brouillon ou en cours de révision → **ne
    pas rédiger le SRS**. Signaler que le SRS attend un PRD validé, et proposer soit de finaliser
    le PRD d'abord (skill `besoins-redaction-prd`), soit d'attendre.

## Étape 2 — Dériver les exigences fonctionnelles (RF)

Parcourir chaque fonctionnalité du PRD (sections Must/Should/Could have) et la traduire en une
ou plusieurs exigences fonctionnelles précises et testables. Une fonctionnalité PRD de haut
niveau ("réservation d'un créneau avec paiement en ligne") se décompose souvent en plusieurs RF
(recherche de créneau, sélection, paiement, confirmation).

Formuler chaque exigence avec un verbe d'obligation clair : "Le système doit permettre à
[acteur] de [action], [condition/résultat attendu]." Numéroter séquentiellement : `RF-001`,
`RF-002`, etc. Ne pas dupliquer le texte du PRD tel quel — le préciser jusqu'au niveau où un
développeur sait quoi construire (entrées attendues, comportements aux cas limites pertinents,
résultat observable).

## Étape 3 — Dériver les exigences non fonctionnelles (RNF)

Couvrir au minimum ces quatre familles, en s'appuyant sur les contraintes déjà données dans le
PRD (section Contraintes) plutôt que d'inventer des chiffres :
- **Performance** : temps de réponse attendus, charge concurrente si mentionnée
- **Sécurité** : protection des données sensibles (paiement, identité), authentification
- **Compatibilité** : plateformes/navigateurs/versions ciblées (reprendre la section Plateforme
  du PRD)
- **Accessibilité** : niveau visé si pertinent pour le public cible

Si le PRD ne donne pas de valeur précise (ex. pas de seuil de performance chiffré), proposer une
valeur raisonnable par défaut pour ce type de projet et la soumettre à l'utilisateur plutôt que
de laisser l'exigence vague ou de la sauter. Numéroter `RNF-001`, `RNF-002`, etc.

## Étape 4 — User stories

Associer à chaque exigence (RF principalement, RNF quand pertinent) une user story au format
"En tant que [rôle], je veux [action], afin de [bénéfice]." Ça garde le lien avec la valeur
utilisateur du PRD plutôt que de tomber dans une liste d'exigences purement techniques.

## Étape 5 — Matrice de traçabilité

Construire un tableau reliant chaque exigence à la fonctionnalité du PRD dont elle découle. Ça
permet de vérifier que rien n'a été oublié et que rien n'a été ajouté sans base dans le PRD.

## Étape 6 — Hypothèses et dépendances externes

Lister ce qui est supposé vrai sans être garanti (ex. disponibilité d'une API tierce, un
comportement attendu d'un service de paiement) et les dépendances externes nécessaires
(intégrations mentionnées dans le PRD, services tiers, API).

## Structure du fichier

Écrire le fichier `srs.md` à la racine du projet, avec cette structure :

```markdown
# SRS — [Nom du projet]

*Rédigé le [date], à partir du PRD validé du [date du PRD]*

## 1. Exigences fonctionnelles

### RF-001 — [Titre court]
**Exigence** : Le système doit permettre à [acteur] de [action], [condition/résultat].
**User story** : En tant que [rôle], je veux [action], afin de [bénéfice].

### RF-002 — [Titre court]
[...]

## 2. Exigences non fonctionnelles

### RNF-001 — Performance
[...]

### RNF-002 — Sécurité
[...]

### RNF-003 — Compatibilité
[...]

### RNF-004 — Accessibilité
[...]

## 3. Matrice de traçabilité

| ID SRS | Description courte | Fonctionnalité PRD correspondante | Priorité PRD |
|--------|---------------------|-------------------------------------|--------------|
| RF-001 | ... | ... | Must have |
| RF-002 | ... | ... | Must have |
| RNF-001 | ... | (Section 3 — Contraintes) | — |

## 4. Hypothèses et dépendances externes

- **Hypothèses** : [ce qu'on suppose vrai sans garantie]
- **Dépendances externes** : [API tierces, services, intégrations nécessaires]
```

## Validation

Présenter le SRS (ou un résumé de ses sections) à l'utilisateur et attendre une validation
explicite avant de considérer le besoin technique comme figé — au même titre que pour le PRD.
Si l'utilisateur repère une exigence manquante ou mal dérivée d'une fonctionnalité du PRD,
corriger et re-présenter plutôt que de laisser une incohérence dans la matrice de traçabilité.
