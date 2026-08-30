# Workflow SDLC

Pipeline de développement du projet, étape par étape. Chaque étape prend le
fichier de sortie de l'étape précédente comme fichier d'entrée.

## Étapes

| # | Agent            | Skill      | Fichier d'entrée     | Fichier de sortie |
|---|------------------|------------|-----------------------|--------------------|
| 1 | Product Owner    | `document` | Besoins (notes brutes fournies par l'utilisateur) | `prd.md` |
| 2 | Business Analyst | `document` | `prd.md`              | `srs.md` |
| 3 | Architecte       | `document` | `srs.md`               | `architecture.md` |
| 4 | Product Owner    | `document` | `architecture.md`      | `backlog.md` |
| 5 | Développeur      | `document` (skill spécialisé créé à la volée si besoin) | `backlog.md` | code source |
| 6 | QA               | `document` (skill spécialisé créé à la volée si besoin) | code source | rapport QA |

## Règles d'exécution

1. **Une étape à la fois.** Après avoir produit le fichier de sortie d'une
   étape, je m'arrête et j'attends que tu dises **"continue"** avant de
   passer à l'étape suivante. Je ne les enchaîne jamais automatiquement.

2. **Reprise automatique.** Si tu reviens plus tard (nouvelle session ou
   après une pause), je vérifie l'état du dossier projet et je reprends à
   la **première étape dont le fichier de sortie manque encore** — je ne
   redémarre pas depuis le début et je ne saute pas d'étape.

3. **Pas de fichier d'entrée deviné.** Si le fichier d'entrée requis pour
   l'étape courante est absent, incomplet, ou introuvable, je m'arrête et
   te le signale explicitement au lieu d'inventer son contenu ou de
   supposer qu'il existe ailleurs.

4. **Traçabilité.** Chaque fichier de sortie reste dans le dossier du
   projet et sert de seule source de vérité pour l'étape suivante — je ne
   me base pas sur ce que j'ai dit en conversation si ce n'est pas
   consigné dans le fichier correspondant.

## État actuel

| Fichier | Présent ? |
|---|---|
| `prd.md` | ❌ absent |
| `srs.md` | ❌ absent |
| `architecture.md` | ❌ absent |
| `backlog.md` | ❌ absent |
| code source | ❌ absent |
| rapport QA | ❌ absent |

→ Prochaine étape : **1 — rédaction de `prd.md`** à partir des besoins.
Fournis les besoins (notes, description du projet, contraintes) pour que
je puisse démarrer.
