---
name: qa-cas-de-test
description: >
  Génère des cas de test tracés au SRS (srs.md) pour une fonctionnalité déjà livrée par
  dev-react (une user story du backlog ou une exigence RF-xxx/RNF-xxx précise), exécute les
  tests automatisés existants du projet (Vitest côté web, Jest côté mobile) pour évaluer chaque
  cas, puis consigne cas de test + résultats + rapport de bugs dans rapport-qa.md. Se déclenche
  chaque fois que l'utilisateur demande de tester, vérifier, valider, auditer ou contrôler la
  conformité au SRS d'une fonctionnalité déjà développée — même sans dire explicitement "QA" ou
  "cas de test", par exemple "est-ce que la réservation marche comme prévu ?", "vérifie que le
  paiement respecte le cahier des charges", "teste ce qu'on vient de livrer" ou "y a-t-il des
  bugs sur le module notation ?".
---

# QA → Cas de test

Ce skill transforme une fonctionnalité déjà codée en verdict vérifiable : est-ce que ce qui a été
livré fait bien ce que le SRS exige ? Tester à l'œil, sans repartir des exigences numérotées,
laisse passer des écarts silencieux (un comportement qui semble correct mais ne couvre pas tout
le RF visé) et ne laisse aucune trace exploitable la fois suivante. Ce skill force à repartir du
SRS et du code réellement livré, et à consigner chaque verdict dans un document qui s'accumule au
fil des sessions de test — exactement comme `backlog.md` s'accumule au fil de l'implémentation.

## Étape 1 — Vérifier les pré-requis et cadrer le périmètre à tester

```bash
find . -maxdepth 1 -iname "srs.md"
find . -maxdepth 1 -iname "backlog.md"
```

- **Si `srs.md` n'existe pas** : impossible de tracer un cas de test à une exigence qui n'existe
  nulle part. Rediriger vers le skill `besoins-redaction-srs` plutôt que d'inventer des critères
  d'acceptation à la volée.
- **Si `srs.md` existe** : le lire en entier pour retrouver les exigences (`RF-xxx`/`RNF-xxx`)
  concernées par la demande.
- **Si `backlog.md` existe** : le consulter pour savoir ce qui est réellement marqué comme livré
  (`✅ Fait`) — inutile de proposer des cas de test pour une story encore `À faire`, le code
  correspondant n'existe pas.
- Cadrer précisément le périmètre :
  - Si l'utilisateur cite un ID (`US-04`, `RF-010`...) ou décrit une fonctionnalité qui matche
    clairement une exigence, l'utiliser directement.
  - Si la demande est large ("teste ce qui a été livré", "vérifie la conformité au SRS"),
    proposer le périmètre déduit de `backlog.md` (les stories `✅ Fait` pas encore couvertes dans
    `rapport-qa.md`, voir Étape 6) et faire confirmer avant de continuer plutôt que de tout tester
    d'un coup sans accord.
  - Si la demande ne correspond à aucune exigence du SRS, le signaler explicitement — ne jamais
    fabriquer un cas de test contre un comportement que le SRS ne spécifie pas, aussi raisonnable
    semble-t-il : ce n'est pas ce document qui a autorité pour décider ce qui doit être vrai.

## Étape 2 — Retrouver le code livré correspondant

Un cas de test doit refléter ce que le code expose réellement (routes/écrans, champs de
formulaire, messages d'erreur affichés, comportements observables) — pas une supposition sur ce
que l'exigence *devrait* donner. Chercher le code avant de rédiger un seul cas :

```bash
grep -rln "RF-010\|US-10" web/src mobile/src packages --include="*.ts" --include="*.tsx"
```

(adapter le motif à l'exigence visée — les commentaires du projet citent systématiquement le
`RF-xxx`/`US-xx` d'origine au-dessus des fichiers concernés, voir la convention de `dev-react`).

- **Si aucun code ne correspond** : la fonctionnalité n'est pas livrée, donc pas testable pour de
  vrai. Le dire, et proposer soit de vérifier `backlog.md`, soit de rediriger vers `dev-react` si
  l'utilisateur veut d'abord la faire développer. Ne pas générer de cas de test "à l'avance" pour
  du code qui n'existe pas encore.
- Repérer aussi les fichiers `*.test.tsx`/`*.test.ts` déjà écrits à côté du code (convention du
  projet) : ils seront le point d'appui de l'Étape 4.

## Étape 3 — Générer les cas de test

Format de table à utiliser systématiquement — cohérent avec les tableaux déjà en place dans
`backlog.md`/`architecture.md` :

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu |
|----|-------------------|-----------------|--------|----------------------|
| TC-010-01 | RF-010 | Un joueur connecté consulte un créneau disponible | 1. Sélectionner le créneau 2. Cliquer "Réserver" | Le créneau passe en verrouillage temporaire ; une réservation `en_attente_paiement` est créée |

- `ID` : `TC-<numéro de l'exigence principale>-<numéro séquentiel>` (ex. `TC-010-01`,
  `TC-010-02`) — lisible immédiatement sans devoir rouvrir la matrice pour savoir de quoi il
  s'agit.
- Une exigence donne rarement un seul cas : couvrir au minimum le cas nominal, un cas limite
  pertinent (ex. créneau déjà réservé par quelqu'un d'autre, champ obligatoire manquant), et un
  cas d'erreur si le comportement dépend d'un appel API — même logique de couverture que
  l'Étape 6 de `dev-react`, vue cette fois du côté vérification plutôt qu'implémentation.
- Une même exigence peut nécessiter des cas côté web ET mobile si le comportement diffère
  (ex. sélecteur de fichier vs `expo-image-picker`) — les lister comme des cas distincts plutôt
  que d'en supposer un seul valable pour les deux.
- Ne pas se limiter à ce que le code fait déjà bien : un cas de test doit exister pour chaque
  aspect testable de l'exigence, même si son résultat s'annonce déjà "Échoué" ou "Non couvert" à
  l'étape suivante — un cas de test qui ne teste que ce qui marche n'a aucune valeur de contrôle.

## Étape 4 — Évaluer chaque cas via les tests automatisés existants

Ce projet n'a pas de backend réel (Laravel non implémenté) mais `dev-react` livre systématiquement
des tests automatisés (Vitest côté web, Jest côté mobile) à côté de chaque composant/écran. Le
principe : s'appuyer sur cette suite déjà écrite plutôt qu'en réécrire une parallèle, et être
honnête sur ce qu'elle couvre vraiment.

```bash
npm test --workspace web
npm test --workspace mobile
```

Pour chaque cas de test, chercher s'il existe un test automatisé qui exerce le même comportement
(même composant, mêmes assertions), puis attribuer l'un de ces quatre statuts — jamais un
cinquième statut improvisé, et jamais "Passé" sans preuve d'exécution réelle :

- **✅ Passé** — un test automatisé couvre ce cas précis et la suite passe.
- **❌ Échoué** — un test automatisé couvre ce cas et échoue, ou l'exécution manuelle du parcours
  (lecture du code + rendu attendu) révèle un écart net avec le résultat attendu du SRS.
- **⏸️ Non exécutable** — le cas dépend d'un maillon absent du projet (backend Laravel, un vrai
  opérateur Wave/Orange Money/Moov Money, un webhook réel...). Toujours préciser la raison
  précise, pas juste "backend absent" en général — ça permet de revérifier ce cas précis une fois
  le maillon manquant disponible.
- **◻️ Non couvert** — aucun test automatisé n'exerce ce cas, et rien n'empêche techniquement de
  le vérifier (contrairement à "Non exécutable"). C'est en soi une découverte utile à faire
  remonter : un trou de couverture, pas un bug de comportement — à distinguer clairement d'un
  ❌ dans le rapport.

## Étape 5 — Rapport de bugs pour les cas échoués

Pour chaque cas ❌, ouvrir une entrée de bug distincte du cas de test lui-même (plusieurs cas
peuvent parfois pointer vers le même bug racine — dans ce cas, les relier au même ID bug plutôt
que dupliquer la description) :

| ID bug | Cas de test | Exigence SRS | Gravité | Description | Attendu (SRS) | Observé |
|--------|--------------|----------------|----------|----------------|------------------|------------|
| BUG-001 | TC-010-02 | RF-010 | Majeur | Le créneau reste "disponible" après verrouillage | Le créneau doit passer en verrouillage temporaire (RF-010) | Aucun changement de statut visible côté UI |

- Gravité : `Bloquant` (empêche le parcours principal) / `Majeur` (fonctionnalité incorrecte mais
  contournable) / `Mineur` (comportement secondaire) / `Cosmétique` (affichage seulement).
- Toujours citer le fichier concerné (`web/src/modules/.../Composant.tsx:42`) quand il est
  identifiable — ça évite à quiconque lit le rapport de devoir rechercher où corriger.

## Étape 6 — Consigner dans `rapport-qa.md`

Un seul fichier cumulatif à la racine du projet, sur le même principe que la section "Suivi
d'implémentation" de `backlog.md` : chaque session de test ajoute/actualise des lignes, rien
n'est écrasé silencieusement d'une session à l'autre.

```markdown
# Rapport QA — [Nom du projet]

*Dernière session : [date]*

## 1. Cas de test & matrice de traçabilité

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-010-01 | RF-010 | ... | ... | ... | ... | ✅ Passé |

## 2. Rapport de bugs

| ID bug | Cas de test | Exigence SRS | Gravité | Description | Attendu | Observé |
|--------|--------------|----------------|----------|----------------|-----------|-----------|

## 3. Suivi des sessions de test

### Session du [date]
- Périmètre testé : [US-xx / RF-xxx concernés]
- N cas de test — X ✅ passés, Y ❌ échoués, Z ⏸️ non exécutables, W ◻️ non couverts
- Bugs ouverts par cette session : [IDs]
```

Si `rapport-qa.md` existe déjà, le lire en entier avant d'ajouter quoi que ce soit : un cas déjà
présent pour la même exigence se met à jour (avec une note "re-testé le [date]") plutôt que de se
dupliquer sous un nouvel ID.

## Étape 7 — Compte-rendu de fin de session

Résumer à l'utilisateur : le périmètre testé, le décompte passé/échoué/non exécutable/non
couvert, les bugs trouvés (avec leur gravité), et où le rapport a été écrit. Si des bugs
bloquants ou majeurs sont trouvés, le signaler clairement en premier plutôt qu'en fin de liste.
Proposer — sans l'imposer — l'étape suivante logique : rediriger vers `dev-react` pour corriger
les bugs trouvés, ou continuer la session de test sur un autre périmètre.

## Ce que ce skill ne fait pas

- Ne corrige pas le code des bugs trouvés — se limite à les documenter avec assez de précision
  pour qu'ils soient corrigeables ; la correction relève de `dev-react`.
- Ne modifie pas le SRS ni l'architecture — si un écart met en évidence une exigence ambiguë ou
  manquante (pas un bug de code, mais un trou de spécification), le signaler explicitement à
  l'utilisateur plutôt que de trancher soi-même, et rediriger vers `besoins-redaction-srs` ou
  `conception-architecture` selon le document concerné.
- N'invente jamais un résultat "Passé" sans preuve d'exécution réelle (test automatisé qui passe,
  ou vérification concrète du code/du rendu) — un cas non vérifié reste "Non couvert" ou "Non
  exécutable", jamais optimistement marqué comme bon.
