# Rapport QA — App de réservation de terrains de sport entre particuliers

*Dernière session : 31 août 2026 (correction de BUG-005, comblement US-06, extraction de useSessionToken)*

## 1. Cas de test & matrice de traçabilité

Périmètre : US-01 (Sprint 1, tâche 1) — inscription joueur. Code vérifié :
`packages/auth-core/src/{useRegisterForm,validation,registerApi}.ts`,
`web/src/modules/authentification/components/RegisterForm.tsx`,
`mobile/src/modules/authentification/screens/RegisterScreen.tsx`.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-001-01 | RF-001 | Formulaire d'inscription vide (web et mobile) | 1. Ne rien saisir 2. Cliquer/toucher "Créer mon compte" | Erreurs affichées pour identifiant, mot de passe et sport ; aucun appel à `/api/auth/register` | `RegisterForm.test.tsx`/`RegisterScreen.test.tsx` : les 3 messages d'erreur s'affichent, `fetchMock` jamais appelé | ✅ Passé |
| TC-001-02 | RF-001 | Identifiant email valide, mot de passe ≥ 8 caractères, un sport sélectionné (web et mobile) | 1. Saisir un email valide 2. Saisir un mot de passe ≥ 8 caractères 3. Sélectionner un sport 4. Soumettre | Appel `POST /api/auth/register` avec le payload constitué | Test "inscrit un joueur avec des données valides" : `fetch` appelé une fois, `POST` sur `/api/auth/register` | ✅ Passé |
| TC-001-03 | RF-001 | Identifiant téléphone valide (ex. `+221771234567`), mot de passe et sport valides | 1. Saisir un numéro de téléphone au format `PHONE_REGEX` (8-15 chiffres, `+` optionnel) 2. Compléter le reste 3. Soumettre | RF-001 exige "email OU téléphone" : le formulaire doit accepter le téléphone comme identifiant valide et appeler l'API | Test "accepte un numéro de téléphone comme identifiant" ajouté (`RegisterForm.test.tsx`/`RegisterScreen.test.tsx`) : `fetch` appelé, aucune erreur "format invalide" affichée | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-001-04 | RF-001 | Identifiant non vide mais au format invalide (ex. `pasuncontact`), mot de passe et sport valides | 1. Saisir `pasuncontact` comme identifiant 2. Compléter le reste 3. Soumettre | Message "Format invalide : saisis un email ou un numéro de téléphone valide." affiché, aucun appel API | `it.each` "affiche une erreur de validation" ajouté, cas identifiant invalide : message affiché, `fetch` jamais appelé | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-001-05 | RF-001 | Mot de passe non vide mais < 8 caractères (ex. `abc123`), identifiant et sport valides | 1. Saisir `abc123` comme mot de passe 2. Compléter le reste 3. Soumettre | Message "Le mot de passe doit contenir au moins 8 caractères." affiché, aucun appel API | `it.each` "affiche une erreur de validation" ajouté, cas mot de passe trop court : message affiché, `fetch` jamais appelé | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-001-06 | RF-001 | Formulaire valide soumis, le backend refuse (ex. identifiant déjà utilisé) | 1. Compléter un formulaire valide 2. Soumettre 3. L'API répond `ok: false` avec un message | Le message d'erreur renvoyé par le backend s'affiche à l'utilisateur | Test "affiche une erreur si l'API refuse l'inscription" : le message "Cet email est déjà utilisé." s'affiche (`role="alert"` web, texte mobile) | ✅ Passé |
| TC-001-07 | RNF-002 | Champ mot de passe visible à l'écran | 1. Observer le rendu du champ mot de passe | Le texte saisi est masqué (`type="password"` web, `secureTextEntry` mobile) — RNF-002 : "les données personnelles... chiffrées... en transit", un mot de passe lisible à l'écran est un minimum attendu au-delà même de ça | Test "masque la saisie du mot de passe" ajouté : `type="password"` (web) et `secureTextEntry === true` (mobile) affirmés | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-001-08 | RNF-002 | Soumission d'une inscription valide | 1. Observer le protocole utilisé pour l'appel à `/api/auth/register` | Les échanges avec le backend transitent en TLS (HTTPS) | Dépend de l'URL réelle de déploiement (`apiBaseUrl`) et du backend Laravel, aucun des deux n'existe dans ce dépôt — rien à observer côté frontend | ⏸️ Non exécutable (backend/déploiement absents) |

**Résumé US-01** : 8 cas — 7 ✅ passés, 0 ❌ échoué, 1 ⏸️ non exécutable, 0 ◻️ non couvert.

---

Périmètre : US-02 (Sprint 1, tâche 2) — connexion et déconnexion. Code vérifié :
`packages/auth-core/src/{useLoginForm,useLogout,loginApi,session}.ts`,
`web/src/modules/authentification/{components/LoginForm.tsx,components/LogoutButton.tsx,sessionStorage.ts}`,
`mobile/src/modules/authentification/{screens/LoginScreen.tsx,components/LogoutButton.tsx,sessionStorage.ts}`.

> **Note SRS** : `srs.md` ne numérote que RF-002 ("Connexion") — aucune exigence dédiée à la
> **déconnexion**, alors que la user story US-02 du backlog couvre explicitement les deux
> ("me connecter et me déconnecter... afin de sécuriser l'accès à mes données"). Les cas
> TC-002-04/05 ci-dessous sont donc tracés à US-02 plutôt qu'à un `RF-xxx` précis — pas un bug,
> mais un trou de traçabilité SRS à signaler : ce skill ne modifie pas `srs.md` lui-même (voir "Ce
> que ce skill ne fait pas"), donc à trancher côté conception (`besoins-redaction-srs`) si la
> déconnexion mérite sa propre exigence numérotée.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-002-01 | RF-002 | Formulaire de connexion vide (web et mobile) | 1. Ne rien saisir 2. Cliquer/toucher "Se connecter" | Erreurs "requis" affichées pour identifiant et mot de passe ; aucun appel à `/api/auth/login` | `LoginForm.test.tsx`/`LoginScreen.test.tsx` : les 2 messages s'affichent, `fetchMock` jamais appelé | ✅ Passé |
| TC-002-02 | RF-002 | Identifiant et mot de passe valides (web et mobile) | 1. Saisir un identifiant 2. Saisir un mot de passe 3. Soumettre | Appel `POST /api/auth/login` ; le token renvoyé est stocké dans le `SessionStorage` de la plateforme | Test "connecte un utilisateur..." : `fetch` appelé, `localStorage.auth_token`/`mockSecureStore.auth_token` = `'abc123'` | ✅ Passé |
| TC-002-03 | RF-002, RNF-002 | Identifiants incorrects soumis (web et mobile) | 1. Saisir un identifiant/mot de passe quelconque 2. Soumettre 3. L'API répond `ok: false` | Message **générique** "Identifiant ou mot de passe incorrect." (ne précise jamais lequel des deux est faux — RNF-002, anti-énumération de comptes) ; aucun token stocké | Test "affiche un message générique..." : message générique affiché, `auth_token` reste `null`/`undefined` | ✅ Passé |
| TC-002-04 | US-02 *(pas de RF dédié, voir note ci-dessus)* | Utilisateur avec un token de session déjà stocké (web et mobile) | 1. Cliquer/toucher "Se déconnecter" 2. Le backend répond `ok: true` | Le token est effacé du `SessionStorage` local | Test "efface le token de session au clic" : `auth_token` devient `null`/absent après l'action | ✅ Passé |
| TC-002-05 | US-02 *(idem)* | Utilisateur avec un token stocké, backend injoignable | 1. Cliquer/toucher "Se déconnecter" 2. L'appel au backend échoue (erreur réseau) | Le token est effacé localement **quand même** — la déconnexion ne doit pas dépendre de la disponibilité du backend | Test "efface quand même le token..." : `auth_token` devient `null`/absent malgré l'échec réseau simulé | ✅ Passé |
| TC-002-06 | RF-002 | Un seul des deux champs rempli (identifiant seul, ou mot de passe seul), l'autre vide | 1. Remplir un seul champ 2. Soumettre | Seule l'erreur du champ manquant s'affiche ; l'autre champ n'affiche pas d'erreur | `it.each` "n'affiche que l'erreur du champ manquant" ajouté (`LoginForm.test.tsx`/`LoginScreen.test.tsx`) : la bonne erreur s'affiche, l'autre est absente, `fetch` jamais appelé | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-002-07 | RNF-002 | Connexion réussie côté **web** | 1. Se connecter avec succès 2. Inspecter comment le token est conservé | RNF-002 : "les données personnelles des utilisateurs doivent être chiffrées **au repos**" | **Corrigé** (voir BUG-001) : `sessionStorage.ts` ne persiste plus le token réel — le secret vit uniquement dans un cookie `HttpOnly` posé par le backend (`loginApi.ts`, `credentials: 'include'`), invisible en JS. `localStorage` ne contient plus qu'un marqueur non sensible (`'authenticated'`), vérifié par `LoginForm.test.tsx` | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-002-08 | RNF-002 | Connexion réussie côté **mobile** | 1. Se connecter avec succès 2. Inspecter comment le token est conservé | RNF-002 : "chiffrées au repos" | Code lu : `mobile/src/modules/authentification/sessionStorage.ts` utilise `expo-secure-store`, qui persiste dans le Keychain (iOS) / Keystore (Android) — chiffré par l'OS | ✅ Passé |
| TC-002-09 | RNF-002 | N/A | 1. Multiplier les tentatives de connexion avec un mauvais mot de passe | RNF-002 : "protéger contre les attaques par force brute courantes (limitation du nombre de tentatives)" | Une limitation de tentatives n'a de valeur que si elle est appliquée côté serveur (un compteur uniquement côté client se contourne trivialement) — aucun backend réel dans ce dépôt pour l'observer ; rien de pertinent à vérifier côté frontend seul | ⏸️ Non exécutable (backend absent) |
| TC-002-10 | RNF-002 | Soumission d'une connexion valide | 1. Observer le protocole utilisé pour l'appel à `/api/auth/login` | Les échanges transitent en TLS (HTTPS) | Même situation que TC-001-08 : dépend du déploiement réel, absent de ce dépôt | ⏸️ Non exécutable (backend/déploiement absents) |

**Résumé US-02** *(à jour après correction de BUG-001 et comblement de TC-002-06)* : 10 cas —
8 ✅ passés, 0 ❌ échoué, 2 ⏸️ non exécutables (TC-002-09 force brute, TC-002-10 TLS — tous deux
dépendants d'un backend réel absent de ce dépôt), 0 ◻️ non couvert.

## 2. Rapport de bugs

| ID bug | Cas de test | Exigence SRS | Gravité | Description | Attendu (SRS) | Observé | Statut |
|--------|--------------|----------------|----------|----------------|------------------|------------|--------|
| BUG-001 | TC-002-07 | RNF-002 | Majeur | Le token de session web était stocké en clair dans `localStorage`, lisible par tout script JS exécuté dans la page (ex. via une faille XSS ailleurs dans l'app) | RNF-002 : les données personnelles doivent être "chiffrées au repos" | **Corrigé le 31 août 2026** : le token réel n'est plus jamais persisté côté web — le backend positionne un cookie `HttpOnly; Secure; SameSite=Lax` sur `/api/auth/login` (`credentials: 'include'` ajouté), invisible en JS ; `localStorage` ne contient plus qu'un marqueur non sensible. Voir `architecture.md` (correction RNF-002 du 31 août 2026) pour le détail du mécanisme | ✅ Corrigé |

**Note sur BUG-001** : ce n'est pas un oubli silencieux — le fichier concerné porte déjà un
commentaire assumant ce choix comme compromis V1 ("localStorage est suffisant pour une V1 ; un
passage à un cookie httpOnly géré par le backend pourra être envisagé plus tard"). Le rôle de la
QA n'est pas d'accepter ce commentaire comme une clôture du sujet : RNF-002, lu littéralement,
n'est pas satisfait côté web tant que ce compromis reste en place. Gravité fixée à "Majeur" plutôt
que "Bloquant" car (a) le parcours principal fonctionne, (b) l'exploitation réelle suppose une
autre faille (XSS) pour lire `localStorage`, mais (c) l'app manipule des réservations/paiements
liés à un compte, donc un vol de token n'est pas un risque cosmétique. **✅ Corrigé le 31 août
2026** (voir la session correspondante ci-dessous).

---

Périmètre : US-03 (Sprint 1, tâche 3) — édition du profil. Code vérifié :
`packages/auth-core/src/{useProfileForm,usePhotoUpload,profileApi,validation}.ts`,
`web/src/modules/authentification/components/ProfileForm.tsx`,
`mobile/src/modules/authentification/screens/ProfileScreen.tsx`.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-003-01 | RF-003 | Profil existant côté backend (nom, ville, sports) | 1. Ouvrir l'écran profil | Les champs sont pré-remplis avec les données renvoyées par `GET /api/profile` | Test "charge et affiche le profil existant" : nom/ville affichés, case "foot" cochée (web et mobile) | ✅ Passé |
| TC-003-02 | RF-003 | Profil chargé, champ nom vidé | 1. Vider le champ nom 2. Enregistrer | Erreur "Le nom est requis..." affichée, aucun appel `PATCH /api/profile` | Test "affiche une erreur de validation si le nom est vidé..." : erreur affichée, `PATCH` jamais appelé | ✅ Passé |
| TC-003-03 | RF-003 | Profil chargé, ville modifiée | 1. Modifier la ville 2. Enregistrer | Confirmation "Profil mis à jour." affichée | Test "enregistre les modifications et affiche une confirmation" : confirmation affichée | ✅ Passé |
| TC-003-04 | RF-003 | Profil chargé | 1. Sélectionner/choisir une nouvelle photo | La photo est envoyée (`POST /api/profile/photo`), l'aperçu affiche la nouvelle URL renvoyée | Test "envoie la photo sélectionnée..."/"sélectionne et envoie une nouvelle photo..." : aperçu mis à jour avec l'URL renvoyée | ✅ Passé |
| TC-003-05 | RF-003 | Profil chargé, tous les sports décochés | 1. Décocher tous les sports 2. Enregistrer | Erreur "Sélectionne au moins un sport pratiqué." affichée, aucun appel `PATCH` — `validateProfilePayload` (`packages/auth-core/src/validation.ts:91-103`) vérifie pourtant ce cas | Test "affiche une erreur de validation si tous les sports sont décochés..." ajouté : erreur affichée, `PATCH` jamais appelé | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-003-06 | RF-003 | Le chargement du profil échoue (`GET /api/profile` renvoie une erreur) | 1. Ouvrir l'écran profil 2. L'API échoue | Message d'erreur bloquant affiché (`loadError && !nom`, aucune donnée à éditer) | Test "affiche une erreur bloquante si le chargement du profil échoue" ajouté : message affiché | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-003-07 | RF-003 | Profil chargé, `PATCH /api/profile` échoue à l'enregistrement | 1. Modifier un champ 2. Enregistrer 3. L'API refuse | Message d'erreur affiché **sans faire disparaître le formulaire déjà chargé** — comportement explicitement voulu par un commentaire du code (`ProfileForm.tsx:58-60`) | Test "affiche une erreur de sauvegarde sans faire disparaître le formulaire déjà chargé" ajouté : message affiché, le champ modifié (`'Abidjan'`) reste visible | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-003-08 | RF-003 | Profil chargé, l'upload de la photo échoue | 1. Sélectionner une photo 2. L'upload échoue côté API | Message d'erreur (`photoError`) affiché, le reste du formulaire reste utilisable | Test "affiche une erreur si l'envoi de la photo échoue..." ajouté : message affiché, le reste du formulaire (nom) reste affiché | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-003-09 | RF-003 | Utilisateur **déjà authentifié** (token valide déjà en session) ouvrant l'écran profil | 1. Ouvrir l'écran profil | Le profil se charge directement — aucun message "non connecté" ne doit apparaître pour un utilisateur réellement connecté | **Corrigé** (voir BUG-002) : `token` initialisé à `undefined` (pas `null`), rendu gaté sur `token === undefined \|\| loading`. Re-testé empiriquement (probe + test permanent ajouté) : plus aucun flash, web et mobile | ✅ Passé *(re-testé le 31 août 2026)* |

**Résumé US-03** *(à jour après correction de BUG-002 et comblement des 4 trous)* : 9 cas —
9 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.

### Bugs — US-03

| ID bug | Cas de test | Exigence SRS | Gravité | Description | Attendu (SRS) | Observé | Statut |
|--------|--------------|----------------|----------|----------------|------------------|------------|--------|
| BUG-002 | TC-003-09 | RF-003 | Mineur | `ProfileForm`/`ProfileScreen` initialisent leur état `token` à `null` (`useState<string \| null>(null)`) au lieu du pattern à trois états (`undefined` = pas encore résolu / `null` = confirmé non connecté) utilisé partout ailleurs dans le projet (ex. `HistoriqueList`, `NotificationsScreen`). Résultat : `useProfileForm` traite le "pas encore lu" comme un "non connecté" confirmé, le temps que `getToken()` (async) résolve | Un utilisateur déjà connecté ouvrant son profil doit voir le chargement, jamais un message lui disant qu'il n'est pas connecté | `token` initialisé à `undefined`, rendu gaté sur `token === undefined \|\| loading` (`ProfileForm.tsx`, `ProfileScreen.tsx`) — même pattern que le reste du projet. Re-vérifié par le même test empirique qui avait révélé le bug (plus aucun flash constaté) et par un test permanent ajouté aux deux suites | ✅ Corrigé |

**Note sur BUG-002** : gravité "Mineur" plutôt que "Majeur" — le message se corrige de lui-même dès
que le token résolu arrive (aucune action bloquée, rien de cassé une fois le profil chargé), et
côté web la fenêtre est vraisemblablement trop courte pour être visible à l'œil nu (résolution de
`localStorage` quasi instantanée). **Côté mobile en revanche**, `expo-secure-store.getItemAsync`
est un vrai appel au pont natif (Keychain/Keystore), potentiellement plus lent sur un appareil
chargé ou juste après le démarrage de l'app — le risque d'un flash réellement visible y est plus
concret. Correctif suggéré : initialiser `token` à `undefined` et gater le rendu sur
`token === undefined || loading`, exactement le pattern déjà en place dans les autres écrans du
projet — pas une nouvelle idée à inventer, juste une incohérence à aligner. **✅ Corrigé le
31 août 2026** (voir la session correspondante).

---

Périmètre : US-04 (Sprint 2) — publication d'une annonce. Code vérifié :
`packages/annonces-core/src/{useCreateTerrainForm,useTerrainPhotoUpload,terrainApi,validation}.ts`,
`web/src/modules/annonces/components/CreateTerrainForm.tsx`,
`mobile/src/modules/annonces/screens/CreateTerrainScreen.tsx`.

> **Note (pas un écart)** : RF-004 mentionne un "tarif" dans l'annonce, absent de ce formulaire —
> déjà documenté dans `backlog.md` (Suivi d'implémentation, US-04) comme un choix assumé : le
> tarif vit sur `CRENEAU` dans le modèle de données (`architecture.md`), pas sur `TERRAIN`, donc
> il est saisi avec US-05. Vérifié ici que cette hypothèse tient toujours (aucun champ tarif nulle
> part dans `CreateTerrainPayload`) — confirmé, pas de nouvel écart à signaler.
>
> **Note sur RF-005 (gestionnaire)** : le texte de l'exigence dit explicitement "selon les mêmes
> modalités qu'un particulier (RF-004)". Aucun concept de rôle "particulier"/"gestionnaire"
> n'existe nulle part dans le modèle de données (`UTILISATEUR` n'a pas de champ `role`) ni dans le
> code de ce formulaire — RF-005 est donc satisfait par construction (un seul flux, utilisable par
> n'importe qui), pas quelque chose qui appelle un cas de test dédié séparé de RF-004.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-004-01 | RF-004, RF-005 | Formulaire vide (web et mobile) | 1. Ne rien saisir 2. Cliquer/toucher "Publier l'annonce" | Erreurs affichées pour sport et adresse ; aucun appel à `/api/terrains` | Test "affiche les erreurs de validation..." : les 2 erreurs s'affichent, `fetchMock` jamais appelé | ✅ Passé |
| TC-004-02 | RF-004, RF-005 | Sport et adresse valides (web et mobile) | 1. Sélectionner un sport 2. Saisir une adresse 3. Publier | Appel `POST /api/terrains` ; passage à la section "ajout de photos" | Test "publie une annonce valide et passe à la section photos" : message "Annonce publiée." affiché | ✅ Passé |
| TC-004-03 | RF-004, RF-005 | Formulaire valide soumis côté **web**, le backend refuse | 1. Compléter le formulaire 2. Publier 3. L'API répond `ok: false` | Message d'erreur affiché | Test "affiche une erreur si la publication échoue côté API" : message affiché (`role="alert"`) | ✅ Passé |
| TC-004-04 | RF-004, RF-005 | Formulaire valide soumis côté **mobile**, le backend refuse | 1. Compléter le formulaire 2. Publier 3. L'API répond `ok: false` | Message d'erreur affiché — même comportement que web | Test "affiche une erreur si la publication échoue côté API" ajouté à `CreateTerrainScreen.test.tsx` : message affiché | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-004-05 | RF-004 | Annonce publiée avec succès (web et mobile) | 1. Publier une annonce 2. Sélectionner/choisir une photo | La photo est envoyée (`POST /api/terrains/:id/photos`), affichée dans la galerie | Test "envoie une photo une fois le terrain créé..."/"sélectionne et envoie une photo..." : photo affichée avec l'URL renvoyée | ✅ Passé |
| TC-004-06 | RF-004 | Annonce publiée, l'upload d'une photo échoue | 1. Sélectionner une photo 2. L'upload échoue côté API | Message d'erreur (`photoError`) affiché, la galerie reste utilisable | Test "affiche une erreur si l'envoi de la photo échoue..." ajouté (web et mobile) : message affiché, le reste de l'écran reste utilisable | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-004-07 | RF-004 | Utilisateur **déjà authentifié**, formulaire rempli et soumis **immédiatement** après le montage du composant, avant que `getToken()` (asynchrone) n'ait résolu | 1. Monter le formulaire 2. Remplir sport + adresse et publier **sans attendre** | La publication doit aboutir (ou au minimum ne pas rejeter un utilisateur réellement connecté) | **Corrigé** (voir BUG-003) : `token` initialisé à `undefined`, bouton "Publier l'annonce" désactivé tant que `token === undefined`. Re-testé empiriquement (probe + test permanent) : plus de faux rejet, et la publication aboutit normalement une fois le token résolu | ✅ Passé *(re-testé le 31 août 2026)* |

**Résumé US-04** *(à jour après correction de BUG-003 et comblement des 2 trous)* : 7 cas —
7 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.

### Bugs — US-04

| ID bug | Cas de test | Exigence SRS | Gravité | Description | Attendu (SRS) | Observé | Statut |
|--------|--------------|----------------|----------|----------------|------------------|------------|--------|
| BUG-003 | TC-004-07 | RF-004 | Majeur | `CreateTerrainForm`/`CreateTerrainScreen` initialisent `token` à `null` et ne gatent pas le rendu sur sa résolution (contrairement à `ProfileForm`/`ProfileScreen` après correction de BUG-002) — un clic/appui "trop rapide" sur "Publier l'annonce", avant que `getToken()` n'ait résolu, fait lire `token = null` par `submit()`, indiscernable d'un "vraiment pas connecté" | Un propriétaire réellement connecté qui remplit et soumet rapidement le formulaire doit voir son annonce publiée, jamais un refus "Connecte-toi..." | **Corrigé le 31 août 2026** : `token` initialisé à `undefined` ; le bouton "Publier l'annonce" reste désactivé tant que `token === undefined` (le formulaire, lui, reste saisissable dès le montage — seule la soumission attend). Re-vérifié par le même test empirique qui avait révélé le bug (plus de faux rejet, publication qui aboutit normalement une fois le token résolu) et par un test permanent ajouté aux deux suites | ✅ Corrigé |

**Note sur BUG-003** : gravité "Majeur" plutôt que "Mineur" (contrairement à BUG-002) — ici ce
n'est pas un message qui s'auto-corrige, c'est la **publication de l'annonce qui échoue
silencieusement** pour un utilisateur pourtant bien connecté : l'appel API n'a jamais lieu. Le
fichier de test mobile documentait déjà ce risque de façon indirecte (helper `flushToken()` avec
un commentaire explicite sur la course entre le rendu et la résolution du token) sans que le
comportement de production sous-jacent n'ait jamais été corrigé ni formellement testé comme
défaillant — le test se contentait de contourner la course plutôt que de la vérifier. Correctif
suggéré : même pattern que BUG-002 (`token: undefined` initial, `submit()` qui attend une
résolution confirmée avant de conclure "non connecté", ou désactiver le bouton tant que
`token === undefined`). **✅ Corrigé le 31 août 2026** (voir la session correspondante).

---

Périmètre : US-05 (Sprint 2) — définition des créneaux et tarifs. Code vérifié :
`packages/annonces-core/src/{useCreneaux,creneauApi,validation}.ts`,
`web/src/modules/annonces/components/CreneauxManager.tsx`,
`mobile/src/modules/annonces/screens/CreneauxScreen.tsx`.

> **Note (pattern récurrent)** : la même faille que BUG-002/BUG-003 (`useState<string \| null>
> (null)` au lieu du pattern à trois états) est présente une **troisième fois** ici
> (`CreneauxManager.tsx:21`, `CreneauxScreen.tsx:28`) — et une recherche rapide dans tout le code
> montre qu'elle existe **aussi** dans `EditTerrainForm.tsx`/`EditTerrainScreen.tsx` (module
> US-06, pas encore couvert par une session QA). Ce n'est plus un cas isolé mais un vrai motif
> récurrent dans la façon dont `dev-react` a initialisé le token de session au fil des stories —
> vaudrait le coup d'envisager un hook partagé (`useSessionToken()`) plutôt que de continuer à
> corriger occurrence par occurrence au fil des sessions QA. **Confirmé exact** : voir BUG-005
> ci-dessous, quatrième occurrence trouvée dans `EditTerrainForm`/`EditTerrainScreen` (US-06).

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-005-01 | RF-006 | Créneaux existants côté backend (web et mobile) | 1. Ouvrir l'écran créneaux | La liste des créneaux existants s'affiche | Test "charge et affiche les créneaux existants" : créneau affiché | ✅ Passé |
| TC-005-02 | RF-006 | Formulaire d'ajout vide (web et mobile) | 1. Ne rien saisir 2. Cliquer/toucher "Ajouter le créneau" | Erreurs affichées pour début/fin/tarif, aucun appel `POST` | Test "affiche les erreurs de validation..." : les 3 erreurs s'affichent, `POST` jamais appelé | ✅ Passé |
| TC-005-03 | RF-006 | Créneau dont la fin précède le début, soumis côté **web** | 1. Saisir début > fin 2. Ajouter | Erreur "La fin doit être après le début." affichée | Test "rejette un créneau dont la fin précède le début" : erreur affichée | ✅ Passé |
| TC-005-04 | RF-006 | Créneau dont la fin précède le début, soumis côté **mobile** | 1. Saisir début > fin 2. Ajouter | Même comportement que web | Test "rejette un créneau dont la fin précède le début" ajouté à `CreneauxScreen.test.tsx` : erreur affichée | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-005-05 | RF-006 | Début/fin/tarif valides (web et mobile) | 1. Saisir un créneau valide 2. Ajouter | Le créneau apparaît dans la liste | Test "ajoute un créneau valide à la liste" : nouveau créneau affiché | ✅ Passé |
| TC-005-06 | RF-006 | Créneau existant, non réservé (web et mobile) | 1. Passer en mode édition 2. Modifier le tarif 3. Enregistrer | Le créneau affiche le nouveau tarif | Test "modifie un créneau existant" : nouveau tarif affiché | ✅ Passé |
| TC-005-07 | RF-006 | Créneau existant, non réservé (web et mobile) | 1. Retirer le créneau | Le créneau disparaît de la liste ; "Aucun créneau défini" s'affiche si c'était le dernier | Test "retire un créneau existant" : créneau disparu, message affiché | ✅ Passé |
| TC-005-08 | RF-006, RF-010 | Créneau au statut `reserve` (web et mobile) | 1. Observer les boutons "Modifier"/"Retirer" de ce créneau | Les deux boutons sont désactivés — un créneau réservé ne doit plus pouvoir être modifié/retiré (`isReserve`, `useCreneaux.ts:11-13`) | Test "désactive la modification et le retrait pour un créneau déjà réservé" : les deux boutons désactivés | ✅ Passé |
| TC-005-09 | RF-006 | Le chargement des créneaux échoue (`GET` renvoie une erreur) | 1. Ouvrir l'écran créneaux 2. L'API échoue | Message d'erreur bloquant affiché (`loadError && creneaux.length === 0`) | Test "affiche une erreur bloquante si le chargement des créneaux échoue" ajouté (web et mobile) : message affiché | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-005-10 | RF-006 | Créneau valide soumis, `POST` échoue | 1. Compléter le formulaire d'ajout 2. Ajouter 3. L'API refuse | Message d'erreur affiché, le formulaire garde les valeurs saisies | Test "affiche une erreur si l'ajout d'un créneau échoue..." ajouté (web et mobile), utilisant enfin `createOk: false` déjà présent dans le mock : message affiché, valeurs conservées | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-005-11 | RF-006 | Créneau existant en mode édition, `PATCH` échoue | 1. Modifier un créneau 2. Enregistrer 3. L'API refuse | Message d'erreur affiché (`updateError`) **et le mode édition reste ouvert** — comportement explicitement voulu par un commentaire du code (`CreneauxManager.tsx:257-258`) | Test "affiche une erreur de modification et laisse le mode édition ouvert" ajouté (web et mobile) : message affiché, bouton "Enregistrer" toujours visible | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-005-12 | RF-006 | Créneau existant, `DELETE` échoue | 1. Retirer un créneau 2. L'API refuse | Message d'erreur affiché (`removeError`), le créneau reste dans la liste | Test "affiche une erreur de retrait et garde le créneau dans la liste" ajouté (web et mobile) : message affiché, créneau toujours présent | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-005-13 | RF-006 | Utilisateur **déjà authentifié** ouvrant l'écran créneaux | 1. Ouvrir l'écran | Le chargement s'affiche puis la liste — jamais de message "non connecté" pour un utilisateur réellement connecté | **Corrigé** (voir BUG-004) : `token` initialisé à `undefined`, rendu gaté sur `token === undefined \|\| loading`. Re-testé empiriquement : plus aucun flash, web et mobile | ✅ Passé *(re-testé le 31 août 2026)* |

**Résumé US-05** *(à jour après correction de BUG-004 et comblement des 5 trous)* : 13 cas —
13 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.

### Bugs — US-05

| ID bug | Cas de test | Exigence SRS | Gravité | Description | Attendu (SRS) | Observé | Statut |
|--------|--------------|----------------|----------|----------------|------------------|------------|--------|
| BUG-004 | TC-005-13 | RF-006 | Mineur | Même défaut que BUG-002 (`token` initialisé à `null` au lieu de `undefined`), troisième occurrence — `CreneauxManager.tsx:21` / `CreneauxScreen.tsx:28` | Un propriétaire déjà connecté ouvrant l'écran créneaux ne doit jamais voir "Connecte-toi..." | `token` initialisé à `undefined`, rendu gaté sur `token === undefined \|\| loading` (même correctif que BUG-002). Re-vérifié par le même test empirique qui avait révélé le bug et par un test permanent ajouté aux deux suites | ✅ Corrigé |

**Note sur BUG-004** : gravité "Mineur" comme BUG-002 (auto-résolu, rien de cassé une fois chargé)
— contrairement à BUG-003, il n'y a pas de perte d'action ici puisque cet écran ne propose aucune
action immédiate au montage (juste une liste à charger). Le correctif est le même que BUG-002
(gate complet de l'écran), pas celui de BUG-003 (désactivation du seul bouton) : cet écran, comme
`ProfileForm`/`ProfileScreen`, bloque déjà toute la vue le temps du chargement — inutile de garder
quoi que ce soit interactif avant la résolution du token ici.

---

Périmètre : US-06 (Sprint 2) — modification et retrait d'une annonce déjà publiée. Code vérifié :
`packages/annonces-core/src/useEditTerrainForm.ts`,
`web/src/modules/annonces/components/EditTerrainForm.tsx`,
`mobile/src/modules/annonces/screens/EditTerrainScreen.tsx`.

> **Note SRS** : comme pour la déconnexion (US-02), cette story n'a pas d'exigence `RF-xxx`
> dédiée — elle complète RF-004/RF-005/RF-006 (le PRD traite "publier une annonce" comme une
> capacité complète : créer, modifier, retirer), documenté ainsi dans le code lui-même
> (`EditTerrainForm.tsx:11-13`). Les cas ci-dessous sont donc tracés à "US-06" plutôt qu'à un
> `RF-xxx` précis.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-006-01 | US-06 | Annonce existante côté backend (web et mobile) | 1. Ouvrir l'écran de modification | Les champs sont pré-remplis (`GET /api/terrains/:id`) | Test "charge et affiche l'annonce existante" : adresse/sport affichés | ✅ Passé |
| TC-006-02 | US-06 | Annonce chargée (web et mobile) | 1. Modifier l'adresse 2. Enregistrer | Confirmation "Annonce mise à jour." affichée | Test "enregistre les modifications et affiche une confirmation" : confirmation affichée | ✅ Passé |
| TC-006-03 | US-06 | Annonce chargée, confirmation acceptée (web et mobile) | 1. Cliquer/toucher "Retirer l'annonce" 2. Confirmer (`window.confirm`/`Alert.alert`) | L'annonce est retirée (`DELETE`), message "Annonce retirée." affiché | Test "demande confirmation puis retire l'annonce" : confirmation déclenchée, message affiché | ✅ Passé |
| TC-006-04 | US-06 | Retrait refusé par le backend côté **web** (ex. créneaux encore réservés) | 1. Retirer 2. Confirmer 3. L'API répond `ok: false` | Le message d'erreur renvoyé par le backend s'affiche | Test "affiche l'erreur du backend si le retrait est refusé..." : message "Créneaux encore réservés." affiché | ✅ Passé |
| TC-006-05 | US-06 | Retrait refusé par le backend côté **mobile** | 1. Retirer 2. Confirmer 3. L'API répond `ok: false` | Même comportement que web | Test "affiche l'erreur du backend si le retrait est refusé..." ajouté à `EditTerrainScreen.test.tsx` (mock étendu avec `deleteOk`) : message affiché | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-006-06 | US-06 | Annonce chargée, boîte de confirmation **refusée** par l'utilisateur (web et mobile) | 1. Cliquer/toucher "Retirer l'annonce" 2. Annuler la confirmation | `remove()` n'est jamais appelé, l'annonce reste affichée normalement | Test "n'appelle pas l'API de retrait si l'utilisateur annule..." ajouté (web : `confirm` renvoie `false` ; mobile : bouton "Annuler" de l'alerte) : `DELETE` jamais appelé | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-006-07 | US-06 | Annonce chargée, champ adresse vidé (web et mobile) | 1. Vider l'adresse 2. Enregistrer | Erreur "L'adresse est requise..." affichée, aucun appel `PATCH` (`validateCreateTerrainPayload`, réutilisée telle quelle depuis US-04) | Test "affiche une erreur de validation si l'adresse est vidée..." ajouté : erreur affichée, `PATCH` jamais appelé | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-006-08 | US-06 | Le chargement de l'annonce échoue (`GET` renvoie une erreur) | 1. Ouvrir l'écran 2. L'API échoue | Message d'erreur bloquant affiché (`loadError && !adresse`) | Test "affiche une erreur bloquante si le chargement de l'annonce échoue" ajouté (web et mobile) : message affiché | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-006-09 | US-06 | Annonce chargée, `PATCH` échoue (hors suppression) | 1. Modifier un champ 2. Enregistrer 3. L'API refuse | Message d'erreur affiché (`saveError`), le formulaire garde les valeurs saisies | Test "affiche une erreur si la modification échoue..." ajouté (web et mobile), utilisant enfin `updateOk: false` : message affiché, valeur modifiée conservée | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-006-10 | US-06 | Utilisateur **déjà authentifié** ouvrant l'écran de modification | 1. Ouvrir l'écran | Le chargement s'affiche puis le formulaire — jamais de message "non connecté" | **Corrigé définitivement** (voir BUG-005 et la note ci-dessous sur `useSessionToken`). Re-testé empiriquement : plus aucun flash, web et mobile | ✅ Passé *(re-testé le 31 août 2026)* |

**Résumé US-06** *(à jour après correction de BUG-005 et comblement des 5 trous)* : 10 cas —
10 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.

### Bugs — US-06

| ID bug | Cas de test | Exigence SRS | Gravité | Description | Attendu (SRS) | Observé | Statut |
|--------|--------------|----------------|----------|----------------|------------------|------------|--------|
| BUG-005 | TC-006-10 | US-06 | Mineur | Même défaut que BUG-002/BUG-004 (`token` initialisé à `null`), quatrième occurrence — `EditTerrainForm.tsx:16` / `EditTerrainScreen.tsx:14` | Un propriétaire déjà connecté ouvrant l'écran de modification ne doit jamais voir "Connecte-toi..." | **Corrigé à la racine** : `EditTerrainForm`/`EditTerrainScreen` utilisent désormais `useSessionToken` (nouveau hook partagé, `packages/auth-core/`), qui élimine la classe entière de défaut plutôt qu'un correctif local de plus. Voir la note ci-dessous | ✅ Corrigé |

**Note sur BUG-005 — et sur BUG-002/003/004 rétroactivement** : au lieu d'appliquer un cinquième
correctif local, un hook partagé `useSessionToken(sessionStorage)` a été extrait dans
`packages/auth-core/` et **les 8 composants concernés (US-01 à US-06)** ont été migrés pour
l'utiliser : `ProfileForm`/`ProfileScreen` (US-03, BUG-002), `CreateTerrainForm`/
`CreateTerrainScreen` (US-04, BUG-003), `CreneauxManager`/`CreneauxScreen` (US-05, BUG-004),
`EditTerrainForm`/`EditTerrainScreen` (US-06, BUG-005). Le hook lit le token une fois au montage
et ne renvoie jamais autre chose que `undefined` (pas encore résolu), `null` (confirmé non
connecté) ou une vraie chaîne — impossible de refaire l'erreur d'initialisation à `null` puisque
plus aucun composant migré ne déclare son propre `useState` pour ça. Voir la session
correspondante en section 3 pour le détail de la migration et la ré-exécution complète des deux
suites de tests (aucune régression).

## 3. Suivi des sessions de test

### Session du 31 août 2026 (test initial)
- Périmètre testé : US-01 / RF-001 (inscription joueur), volet RNF-002 directement lié à ce
  formulaire (masquage du mot de passe, TLS).
- 8 cas de test — 3 ✅ passés, 0 ❌ échoué, 1 ⏸️ non exécutable, 4 ◻️ non couverts.
- Bugs ouverts par cette session : aucun.
- **Recommandation** : le comportement de `validateRegisterPayload` (identifiant téléphone,
  identifiant mal formé, mot de passe juste sous la limite) est correct à la lecture du code
  (`packages/auth-core/src/validation.ts`), mais rien ne le prouve par l'exécution — les 3 cas
  `TC-001-03/04/05` sont de bons candidats de tests supplémentaires à ajouter dans
  `RegisterForm.test.tsx`/`RegisterScreen.test.tsx` (paramétrés `it.each`, comme déjà fait
  ailleurs dans le projet, ex. `HistoriqueList.test.tsx`) plutôt qu'à considérer comme acquis.
  `TC-001-07` (masquage du mot de passe) est un ajout à très faible coût (une assertion sur
  l'attribut `type`/`secureTextEntry`) qui mérite d'être couvert vu qu'il touche directement
  RNF-002.

### Session du 31 août 2026 (comblement des trous de couverture)
- Périmètre : les 4 cas `◻️ Non couverts` de la session précédente (TC-001-03/04/05/07).
- `dev-react` a ajouté les 4 tests manquants dans `RegisterForm.test.tsx` (web, +4 tests) et
  `RegisterScreen.test.tsx` (mobile, +4 tests) — aucun code de production modifié, le
  comportement testé existait déjà.
- Ré-exécution : web 7/7 verts (`npx vitest run RegisterForm`), mobile 7/7 verts
  (`npx jest RegisterScreen`) ; suites complètes du projet toujours vertes (web 89/89, mobile
  82/82) et `tsc --noEmit` propre des deux côtés — aucune régression introduite.
- Les 4 cas passent de ◻️ à ✅. Bugs ouverts par cette session : aucun.
- **US-01 / RF-001 est maintenant intégralement couvert par des tests automatisés** ; seul
  TC-001-08 (TLS en transit) reste ⏸️ non exécutable, faute de backend/déploiement réels dans ce
  dépôt — à revérifier une fois le backend Laravel disponible.

### Session du 31 août 2026 (US-02 / RF-002 — connexion et déconnexion)
- Périmètre testé : US-02 (Sprint 1, tâche 2), RF-002 + volet RNF-002 directement lié à la
  connexion (message générique anti-énumération, stockage du token, force brute, TLS).
- 10 cas de test — 7 ✅ passés, 1 ❌ échoué, 2 ⏸️ non exécutables, 1 ◻️ non couvert.
- **1 bug ouvert : BUG-001 (Majeur)** — token de session stocké en clair dans `localStorage` côté
  web, ne satisfait pas RNF-002 ("chiffrées au repos"), contrairement au mobile
  (`expo-secure-store`, chiffré). Voir section 2 pour le détail et la note sur le compromis V1
  déjà documenté dans le code.
- **Écart de traçabilité SRS signalé (pas un bug)** : la déconnexion (moitié de la user story
  US-02) n'a pas de `RF-xxx` dédié dans `srs.md` — seule la connexion est numérotée (RF-002). Les
  cas TC-002-04/05 restent donc tracés à la user story, pas à une exigence SRS précise.
- **Recommandation** : `TC-002-06` (un seul champ rempli sur les deux) est un candidat de test
  supplémentaire à faible coût, même logique que les gaps comblés pour US-01. `BUG-001` mérite une
  décision produit explicite (rester sur `localStorage` pour la V1 en connaissance de cause, ou
  prioriser le passage à un cookie httpOnly déjà évoqué dans le code) plutôt que de rester un
  compromis implicite non tranché.

### Session du 31 août 2026 (correction de BUG-001 et comblement de TC-002-06)
- **BUG-001 corrigé** : `architecture.md` mis à jour en premier (correction RNF-002 datée,
  section 4) avant de coder, même discipline que les écarts de modèle de données détectés plus
  tôt dans le projet. Nouveau mécanisme : le backend positionne un cookie `HttpOnly; Secure;
  SameSite=Lax` sur `/api/auth/login` (invisible en JS, donc inexfiltrable même via une future
  faille XSS) ; `webSessionStorage` ne persiste plus qu'un marqueur non sensible
  (`'authenticated'`) pour piloter l'affichage. `credentials: 'include'` ajouté à `loginApi.ts`/
  `logoutApi` et aux **27 appels `fetch` authentifiés** des 12 packages `@app/*-core` (paiement,
  réservation, notation, historique, notifications, messagerie, parrainage, annonces, recherche)
  pour que ce cookie soit bien envoyé sur chaque requête. **Mobile non touché** : déjà conforme
  (`expo-secure-store`, TC-002-08 ✅), continue d'utiliser un vrai token en en-tête `Authorization`.
  Correctif choisi en pleine ampleur (option confirmée par l'utilisateur) plutôt qu'un correctif
  partiel limité au seul login/logout.
- **TC-002-06 comblé** : `it.each` ajouté dans `LoginForm.test.tsx`/`LoginScreen.test.tsx` pour le
  cas "un seul champ rempli sur les deux".
- Un test existant (`LoginForm.test.tsx`, assertion sur le contenu de `localStorage`) a dû être
  mis à jour : il attendait le vrai token (`'abc123'`), désormais remplacé par le marqueur
  (`'authenticated'`) — changement attendu et documenté dans le test lui-même, pas une régression.
- Ré-exécution complète : web 91/91 verts, mobile 84/84 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression sur le reste de l'app malgré l'ampleur du correctif (27 fichiers).
- **US-02 / RF-002 est maintenant intégralement couvert et conforme** ; seuls TC-002-09 (force
  brute) et TC-002-10 (TLS) restent ⏸️ non exécutables, faute de backend réel.

### Session du 31 août 2026 (US-03 / RF-003 — édition du profil)
- Périmètre testé : US-03 (Sprint 1, tâche 3), RF-003 (chargement, validation, sauvegarde, upload
  photo).
- 9 cas de test — 4 ✅ passés, 1 ❌ échoué, 0 ⏸️ non exécutable, 4 ◻️ non couverts.
- **1 bug ouvert : BUG-002 (Mineur)** — `ProfileForm`/`ProfileScreen` affichent brièvement
  "Connecte-toi pour accéder à ton profil." même pour un utilisateur déjà authentifié, à cause
  d'un état `token` initialisé à `null` au lieu du pattern à trois états utilisé ailleurs dans le
  projet. **Reproduit par un test dédié** (pas seulement supposé à la lecture du code) sur les
  deux plateformes — voir section 2 pour le détail et le correctif suggéré.
- **Recommandation** : 4 trous de couverture à combler (`TC-003-05/06/07/08` — sports vidés,
  échec de chargement, échec de sauvegarde, échec d'upload), même profil que les gaps comblés
  pour US-01/US-02. `TC-003-07` mérite une attention particulière : le code porte un commentaire
  explicite sur le comportement voulu (le formulaire ne doit pas disparaître après une erreur de
  sauvegarde) mais rien ne le vérifie — exactement le genre de comportement documenté-mais-non-
  testé qui casse silencieusement lors d'un futur refactor.

### Session du 31 août 2026 (correction de BUG-002 et comblement des 4 trous US-03)
- **BUG-002 corrigé** : `token` réinitialisé à `undefined` (plus `null`) dans `ProfileForm.tsx`
  et `ProfileScreen.tsx`, rendu gaté sur `token === undefined || loading` — alignement sur le
  pattern à trois états déjà en place partout ailleurs dans le projet, pas une nouvelle
  invention. Re-testé avec le **même test empirique** qui avait servi à confirmer le bug (rendu
  synchrone juste après `render()`, avant que la promesse de lecture du token ne résolve) : plus
  aucune trace du message "Connecte-toi..." sur les deux plateformes. Un test permanent
  ("n'affiche jamais le message de connexion pour un utilisateur déjà authentifié") a été ajouté
  aux deux suites pour éviter une régression silencieuse future.
- **4 trous comblés** : `TC-003-05` (sports décochés), `TC-003-06` (échec de chargement),
  `TC-003-07` (échec de sauvegarde, formulaire qui doit rester affiché), `TC-003-08` (échec
  d'upload photo) — 5 tests ajoutés par plateforme (les 4 gaps + le test de non-régression de
  BUG-002).
- Ré-exécution complète : web 96/96 verts, mobile 89/89 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-03 / RF-003 est maintenant intégralement couvert et conforme, sans cas non exécutable.**

### Session du 31 août 2026 (US-04 / RF-004 — publication d'une annonce)
- Périmètre testé : US-04 (Sprint 2), RF-004 (particulier) + RF-005 (gestionnaire, satisfait par
  construction — voir note dans la matrice, aucun concept de rôle dans le modèle de données).
- 7 cas de test — 4 ✅ passés, 1 ❌ échoué, 0 ⏸️ non exécutable, 2 ◻️ non couverts.
- **1 bug ouvert : BUG-003 (Majeur)** — soumission rapide après montage (avant résolution du
  token) rejetée à tort comme "non connecté", API jamais appelée, pour un utilisateur pourtant
  authentifié. Reproduit empiriquement sur web et mobile, même classe de défaut que BUG-002 mais
  conséquence plus grave (publication silencieusement perdue, pas un simple flash visuel). Le
  fichier de test mobile portait déjà un indice de ce risque (helper `flushToken()`) sans que le
  comportement de production n'ait été corrigé.
- **Écart de couverture entre plateformes signalé** : `TC-004-04` (publication refusée côté API)
  est testé côté web mais pas côté mobile — les deux suites de tests avaient jusqu'ici une parité
  quasi totale sur les autres user stories, celle-ci fait exception.
- **Recommandation** : corriger BUG-003 avec le même pattern que BUG-002 (déjà éprouvé),
  puis combler `TC-004-04` (parité web/mobile) et `TC-004-06` (échec d'upload photo).

### Session du 31 août 2026 (correction de BUG-003 et comblement des 2 trous US-04)
- **BUG-003 corrigé** — variante du correctif de BUG-002, adaptée puisque ces écrans doivent
  rester saisissables avant résolution du token (contrairement à `ProfileForm`/`ProfileScreen`,
  qui bloquent tout l'écran) : `token` réinitialisé à `undefined`, mais seul le bouton "Publier
  l'annonce" est désactivé tant que `token === undefined` (`disabled={submitting || token ===
  undefined}`) — le reste du formulaire reste utilisable immédiatement. Re-testé avec le même
  scénario qui avait servi à confirmer le bug (interaction synchrone juste après montage, sans
  attendre) : le bouton est bien désactivé, aucun faux rejet, et la publication aboutit
  normalement une fois le token résolu (vérifié de bout en bout, y compris l'appel API réel).
  Test de non-régression permanent ajouté aux deux suites.
- **2 trous comblés** : `TC-004-04` (publication refusée côté mobile, alignant sa couverture sur
  celle du web) et `TC-004-06` (échec d'upload photo, web et mobile).
- Ré-exécution complète : web 98/98 verts, mobile 92/92 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-04 / RF-004 est maintenant intégralement couvert et conforme, sans cas non exécutable.**

### Session du 31 août 2026 (US-05 / RF-006 — créneaux et tarifs)
- Périmètre testé : US-05 (Sprint 2), RF-006 (ajout de créneaux, tarifs, cohérence avec RF-010
  pour les créneaux déjà réservés).
- 13 cas de test — 7 ✅ passés, 1 ❌ échoué, 0 ⏸️ non exécutable, 5 ◻️ non couverts.
- **1 bug ouvert : BUG-004 (Mineur)** — troisième occurrence du même défaut que BUG-002
  (`token` initialisé à `null` au lieu du pattern à trois états), cette fois dans
  `CreneauxManager`/`CreneauxScreen`. Une recherche dans tout le code montre que le même motif
  existe **aussi** dans `EditTerrainForm`/`EditTerrainScreen` (US-06, pas encore testé) — signalé
  comme un pattern récurrent plutôt qu'un cas isolé, avec une suggestion d'extraire un hook
  partagé (`useSessionToken()`) pour arrêter de le corriger occurrence par occurrence.
- **Écart de parité web/mobile signalé** : `TC-005-04` (créneau "fin avant début") est testé côté
  web mais pas côté mobile — deuxième écart de ce type après `TC-004-04`.
- **4 autres trous de couverture** : échec de chargement, échec d'ajout (le mock de test le
  supportait déjà sans qu'aucun test ne l'utilise — signal clair d'un test oublié plutôt
  qu'un comportement jamais anticipé), échec de modification (comportement documenté en
  commentaire mais jamais vérifié, même profil que `TC-003-07`), échec de retrait.
- **Recommandation** : corriger BUG-004 (même correctif que BUG-002), combler les 5 trous, et
  garder à l'esprit le pattern récurrent du token pour la prochaine session QA (US-06, qui
  touchera très probablement `EditTerrainForm`/`EditTerrainScreen`).

### Session du 31 août 2026 (correction de BUG-004 et comblement des 5 trous US-05)
- **BUG-004 corrigé** : même correctif que BUG-002 — `token` réinitialisé à `undefined`, rendu
  gaté sur `token === undefined || loading` (`CreneauxManager.tsx`, `CreneauxScreen.tsx`).
  Re-testé avec le même scénario qui avait révélé le bug : plus aucune trace du message
  "Connecte-toi...". Test de non-régression permanent ajouté aux deux suites.
- **5 trous comblés** : `TC-005-04` (parité mobile sur "fin avant début"), `TC-005-09` (échec de
  chargement), `TC-005-10` (échec d'ajout — le mock `createOk: false` est enfin utilisé),
  `TC-005-11` (échec de modification, mode édition qui reste ouvert), `TC-005-12` (échec de
  retrait). Les mocks `createFetchMock` (web et mobile) ont été étendus avec `updateOk`/
  `removeOk`/`listOk` sur le même principe que `createOk`.
- Ré-exécution complète : web 103/103 verts, mobile 98/98 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-05 / RF-006 est maintenant intégralement couvert et conforme, sans cas non exécutable.**
  Rappel : le pattern du token (`undefined` initial + gate) reste à vérifier pour US-06, où
  `EditTerrainForm`/`EditTerrainScreen` portent probablement le même défaut non corrigé.

### Session du 31 août 2026 (US-06 — modification et retrait d'une annonce)
- Périmètre testé : US-06 (Sprint 2), pas d'exigence `RF-xxx` dédiée (complète RF-004/005/006).
- 10 cas de test — 4 ✅ passés, 1 ❌ échoué, 0 ⏸️ non exécutable, 5 ◻️ non couverts.
- **1 bug ouvert : BUG-005 (Mineur)** — **anticipé dès la session précédente** et confirmé exact :
  quatrième occurrence du défaut `token` initialisé à `null` (`EditTerrainForm.tsx:16`,
  `EditTerrainScreen.tsx:14`). La recommandation d'extraire un hook partagé `useSessionToken()`
  est réitérée, avec plus d'insistance vu le nombre d'occurrences désormais corrigées une par une.
- **Écart de parité web/mobile signalé** : `TC-006-05` (retrait refusé par le backend) est testé
  côté web mais son équivalent mobile n'existe même pas dans le mock — quatrième écart de parité
  de ce type.
- **4 autres trous de couverture** : confirmation de suppression annulée par l'utilisateur (aucun
  test ne couvre le chemin "annuler"), validation du formulaire de modification (adresse vidée),
  échec de chargement de l'annonce, échec de sauvegarde (mock déjà prêt côté web, jamais utilisé
  — même motif que `TC-005-10`).
- **Recommandation** : corriger BUG-005 (même correctif que BUG-002/BUG-004), combler les 5
  trous, et sérieusement considérer l'extraction du hook `useSessionToken()` avant la prochaine
  story plutôt que d'attendre une cinquième occurrence.

### Session du 31 août 2026 (correction de BUG-005, comblement US-06, extraction de useSessionToken)
- **BUG-005 corrigé**, et cette fois avec la correction structurelle recommandée plutôt qu'un
  cinquième correctif local : nouveau hook `useSessionToken(sessionStorage)` créé dans
  `packages/auth-core/src/useSessionToken.ts`, exporté depuis l'index du package. Il encapsule le
  pattern à trois états (`undefined`/`null`/`string`) une seule fois, avec un garde
  `cancelled` sur l'effet (petite amélioration au passage, absente de toutes les implémentations
  précédentes).
- **Migration complète des 8 composants concernés (US-01 à US-06)** vers ce hook, chacun
  perdant son `useState`/`useEffect` de lecture de token dupliqué :
  - `ProfileForm.tsx` / `ProfileScreen.tsx` (US-03)
  - `CreateTerrainForm.tsx` / `CreateTerrainScreen.tsx` (US-04)
  - `CreneauxManager.tsx` / `CreneauxScreen.tsx` (US-05)
  - `EditTerrainForm.tsx` / `EditTerrainScreen.tsx` (US-06)

  US-01 (`RegisterForm`/`RegisterScreen`) et US-02 (`LoginForm`/`LoginScreen`/`LogoutButton`)
  n'avaient pas ce défaut — ils ne lisent jamais de token au montage (formulaires
  pré-authentification, ou lecture différée au clic pour `LogoutButton`) — donc rien à y migrer,
  vérifié explicitement plutôt que supposé.
- **5 trous comblés côté US-06** : `TC-006-05` (parité mobile sur le retrait refusé — le mock
  mobile ne supportait même pas l'option), `TC-006-06` (confirmation de suppression annulée),
  `TC-006-07` (validation adresse vidée), `TC-006-08` (échec de chargement), `TC-006-09` (échec
  de sauvegarde, mock web déjà prêt mais jamais utilisé).
- Ré-exécution complète après migration : **web 108/108 verts, mobile 104/104 verts**,
  `tsc --noEmit` propre des deux côtés — aucune régression sur l'ensemble du projet malgré une
  migration touchant 8 fichiers de composants en plus des 4 fichiers de test étendus.
- **US-06 est maintenant intégralement couvert et conforme, sans cas non exécutable.** Le défaut
  `token` initialisé à `null` est éliminé structurellement : il ne peut plus réapparaître dans un
  composant migré, et tout nouveau composant du module Authentification/Annonces qui a besoin du
  token de session dispose maintenant d'un hook déjà correct à réutiliser directement plutôt que
  de le réimplémenter à la main.
