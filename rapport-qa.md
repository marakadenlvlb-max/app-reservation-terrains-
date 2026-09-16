# Rapport QA — App de réservation de terrains de sport entre particuliers

*Dernière session : 9 septembre 2026 (transparence de la réduction de parrainage — plus aucun
point ouvert dans ce rapport, ni décision métier ni bug)*

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

---

Périmètre : US-07 (Sprint 4) — recherche par sport, localisation et date/heure. Code vérifié :
`packages/recherche-core/src/{useRechercheTerrains,rechercheApi}.ts`,
`web/src/modules/recherche/components/SearchTerrains.tsx`,
`mobile/src/modules/recherche/screens/SearchTerrainsScreen.tsx`.

> **Note de périmètre** : `SearchTerrains`/`SearchTerrainsScreen` portent aussi le tri par
> proximité (US-09) et les filtres prix/distance/équipements (US-23), déjà testés et couverts
> dans leurs sessions respectives (voir plus haut — US-09 et US-23 n'ont pas encore eu leur
> propre session QA formelle à ce jour, mais leurs cas de test existent déjà dans le code). Cette
> session se limite strictement à RF-007 (sport, localisation) et RF-008 (date, heure), pour
> rester alignée avec le découpage du backlog qui traite ces user stories séparément.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-007-01 | RF-007, RF-008 | Aucune session (visiteur non connecté), aucun filtre saisi (web et mobile) | 1. Ouvrir la recherche 2. Cliquer/toucher "Rechercher" sans rien remplir | Les résultats s'affichent ; aucun en-tête `Authorization` envoyé (recherche publique) | Test "effectue une recherche sans être connecté.../sans nécessiter de session" : résultats affichés, pas d'`Authorization` | ✅ Passé |
| TC-007-02 | RF-007 | Sport sélectionné (web et mobile) | 1. Sélectionner un sport 2. Rechercher | Le paramètre `sport` est envoyé dans la requête | Test "envoie les filtres sélectionnés.../envoie le sport sélectionné..." : `sport=foot` dans l'URL | ✅ Passé |
| TC-007-03 | RF-007 | Localisation saisie, soumis côté **web** | 1. Saisir une localisation 2. Rechercher | Le paramètre `localisation` est envoyé | Test "envoie les filtres sélectionnés..." (combiné avec sport+date) : `localisation=Dakar` dans l'URL | ✅ Passé |
| TC-007-04 | RF-007 | Localisation saisie, soumis côté **mobile** | 1. Saisir une localisation 2. Rechercher | Même comportement que web | Test "envoie la localisation saisie dans la requête" ajouté à `SearchTerrainsScreen.test.tsx` : `localisation=Dakar` dans l'URL | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-007-05 | RF-008 | Date saisie, soumis côté **mobile** | 1. Saisir une date 2. Rechercher | Le paramètre `date` est envoyé | Test "envoie la date saisie dans la requête" ajouté : `date=2026-09-01` dans l'URL | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-007-06 | RF-008 | Heure saisie (web et mobile) | 1. Saisir une heure 2. Rechercher | Le paramètre `heure` est envoyé | Test "envoie l'heure sélectionnée/saisie dans la requête" ajouté (web et mobile) : `heure=18%3A00` dans l'URL | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-007-07 | RF-007, RF-008 | Aucun créneau ne correspond aux critères (web et mobile) | 1. Rechercher | Message "Aucun créneau disponible pour ces critères." affiché | Test "affiche un message clair quand aucun créneau ne correspond" : message affiché | ✅ Passé |
| TC-007-08 | RF-007, RF-008 | Le backend échoue (web et mobile) | 1. Rechercher 2. L'API répond `ok: false` | Message d'erreur affiché | Test "affiche une erreur si la recherche échoue" : message affiché | ✅ Passé |

**Résumé US-07** *(à jour après comblement des 4 trous)* : 8 cas — 8 ✅ passés, 0 ❌ échoué,
0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé cette session** — première depuis le début de la QA du Must have. Cohérent
avec le fait que ce module est public (pas de lecture de session au montage), donc structurellement
à l'abri de la classe de défaut corrigée par `useSessionToken` (US-03 à US-06).

---

Périmètre : US-08 (Sprint 4) — consultation d'une annonce. Code vérifié :
`packages/recherche-core/src/useTerrainDetail.ts`,
`web/src/modules/recherche/components/TerrainDetailView.tsx`,
`mobile/src/modules/recherche/screens/TerrainDetailScreen.tsx`.

> **Note de périmètre** : ces deux écrans intègrent aussi `ReserverCreneauBouton` (US-10, pas
> encore passée en session QA) — hors périmètre ici, cette session se limite à RF-009
> (consultation : photos, équipements, note, créneaux disponibles).
>
> **Observation (pas un bug)** : le message de secours "Cette annonce n'existe pas ou n'est plus
> disponible." (`TerrainDetailView.tsx:26`, `TerrainDetailScreen.tsx:30`) n'est affiché que quand
> `error` est vide ET `detail` est vide en même temps — un état que `useTerrainDetail.ts` ne
> produit jamais en pratique (son effet met soit `error`, soit `detail`, jamais les deux vides
> après le chargement). Ce texte semble donc du code mort, sans impact utilisateur observable
> (les deux tests "erreur" existants passent par le vrai message d'erreur, pas ce texte de
> secours) — signalé pour information, pas comme un défaut à corriger.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-008-01 | RF-009 | Annonce complète côté backend (web et mobile) | 1. Ouvrir le détail de l'annonce | Photos, équipements, note moyenne et créneaux disponibles s'affichent | Test "affiche les informations de l'annonce..." : tous les éléments affichés | ✅ Passé |
| TC-008-02 | RF-009 | Le chargement échoue (web et mobile) | 1. Ouvrir le détail 2. L'API répond `ok: false` | Message d'erreur affiché | Test "affiche une erreur si l'annonce n'existe plus" : message affiché | ✅ Passé |
| TC-008-03 | RF-009 | Propriétaire/gestionnaire sans note (`proprietaireNoteMoyenne: null`), côté **web** | 1. Ouvrir le détail | "Pas encore de note" affiché au lieu d'une note chiffrée | Test "indique l'absence de note..." : message affiché | ✅ Passé |
| TC-008-04 | RF-009 | Même cas côté **mobile** | 1. Ouvrir le détail | Même comportement que web | Test "indique l'absence de note..." ajouté à `TerrainDetailScreen.test.tsx` : message affiché | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-008-05 | RF-009 | Annonce sans aucun créneau disponible (`creneauxDisponibles: []`), web et mobile | 1. Ouvrir le détail | "Aucun créneau disponible pour l'instant." affiché | Test "affiche un message clair quand l'annonce n'a aucun créneau disponible" ajouté (web et mobile) : message affiché | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-008-06 | RF-009 | Annonce sans aucune photo (`photos: []`), web et mobile | 1. Ouvrir le détail | La galerie ne s'affiche pas, pas d'erreur ni de rendu vide cassé | Test ajouté (web et mobile) : le reste du contenu s'affiche normalement, `queryByAltText` confirme l'absence de photo côté web | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-008-07 | RF-009 | Annonce sans aucun équipement (`equipements: []`), web et mobile | 1. Ouvrir le détail | La section "Équipements" ne s'affiche pas | Test ajouté (web et mobile) : section absente | ✅ Passé *(re-testé le 31 août 2026)* |
| TC-008-08 | RF-009 | Annonce sans type renseigné (`type: null`), web et mobile | 1. Ouvrir le détail | Aucune ligne de type affichée, pas de crash (`null` rendu conditionnellement) | Test ajouté (web et mobile) : pas de crash, ligne de type absente | ✅ Passé *(re-testé le 31 août 2026)* |

**Résumé US-08** *(à jour après comblement des 5 trous)* : 8 cas — 8 ✅ passés, 0 ❌ échoué,
0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé cette session** — deuxième session consécutive sans découverte de défaut ;
même raisonnement que US-07 (module public, pas de lecture de session au montage).

---

Périmètre : US-09 (Sprint 4) — tri des résultats de recherche par proximité, extension de RF-007
("...et par localisation/**proximité**"). Code vérifié : `SearchTerrains.tsx`/
`SearchTerrainsScreen.tsx` (fonction `handleSortByProximity`), `useRechercheTerrains.ts`
(`position`, `setPosition`, paramètre `overridePosition` de `search`).

> **Note de périmètre** : le reste de `SearchTerrains`/`SearchTerrainsScreen` (sport, localisation
> texte, date, heure) a déjà sa propre session QA (US-07, ci-dessus) — cette session se limite
> strictement à l'acquisition de la position et à son usage dans la recherche.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-009-01 | RF-007 | Géolocalisation disponible et autorisée (web et mobile) | 1. Toucher/cliquer "Trier par proximité" | La position acquise est incluse (`latitude`/`longitude`) dans la recherche lancée automatiquement | Test "inclut la position GPS dans la recherche une fois le tri par proximité activé" : `latitude=14.7167`/`longitude=-17.4677` dans l'URL | ✅ Passé |
| TC-009-02 | RF-007 | Le backend renvoie une distance pour un résultat (web et mobile) | 1. Rechercher | La distance s'affiche ("à X km") | Test "affiche la distance renvoyée par le backend quand elle est présente" : distance affichée | ✅ Passé |
| TC-009-03 | RF-007 | Géolocalisation indisponible sur l'appareil, côté **web** (`navigator.geolocation` absent) | 1. Cliquer "Trier par proximité" | Message "La géolocalisation n'est pas disponible sur cet appareil." affiché, pas d'appel API | Test "affiche un message clair quand la géolocalisation n'est pas disponible..." ajouté : message affiché, `fetch` jamais appelé | ✅ Passé *(re-testé le 1 septembre 2026)* |
| TC-009-04 | RF-007 | L'acquisition de la position échoue côté **web** (callback d'erreur de `getCurrentPosition`, ex. permission refusée) | 1. Cliquer "Trier par proximité" 2. L'acquisition échoue | Message "Impossible de récupérer ta position. Vérifie les autorisations du navigateur." affiché | Test "affiche un message clair quand l'acquisition de la position échoue" ajouté : message affiché | ✅ Passé *(re-testé le 1 septembre 2026)* |
| TC-009-05 | RF-007 | Permission de localisation refusée côté **mobile** (`requestForegroundPermissionsAsync` renvoie `granted: false`) | 1. Toucher "Trier par proximité" | Message "Autorise la localisation pour trier les résultats par proximité." affiché, pas d'appel API | Test "affiche un message clair quand la permission de localisation est refusée" ajouté : message affiché, `fetch` jamais appelé | ✅ Passé *(re-testé le 1 septembre 2026)* |
| TC-009-06 | RF-007 | Échec inattendu de l'acquisition côté **mobile** (`getCurrentPositionAsync` rejette, ex. GPS désactivé) | 1. Toucher "Trier par proximité" | Message "Impossible de récupérer ta position." affiché | Test "affiche un message clair quand l'acquisition de la position échoue de façon inattendue" ajouté : message affiché | ✅ Passé *(re-testé le 1 septembre 2026)* |

**Résumé US-09** *(à jour après comblement des 4 trous)* : 6 cas — 6 ✅ passés, 0 ❌ échoué,
0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé cette session** — troisième session consécutive sans découverte de défaut ;
la géolocalisation n'implique elle non plus aucune lecture de session.

---

Périmètre : US-10 (Sprint 5) — sélection et verrouillage temporaire d'un créneau. Code vérifié :
`packages/reservation-core/src/{useReserverCreneau,useCountdown,reservationApi}.ts`,
`web/src/modules/recherche/components/ReserverCreneauBouton.tsx`,
`mobile/src/modules/recherche/components/ReserverCreneauBouton.tsx`.

> **Note de périmètre** : `ReserverCreneauBouton` embarque aussi `ReservationStatusPanel`, qui
> affiche la confirmation/annulation obtenues par **polling** — explicitement commenté dans le
> code comme relevant d'US-11/RF-014 (paiement), pas de RF-010. Cette session se limite à RF-010
> (sélection, verrouillage, expiration du délai) ; les statuts "confirmée"/"annulée" pilotés par
> le polling ont déjà des tests écrits mais n'ont pas encore leur propre session QA — à faire lors
> du passage sur US-11.
>
> Premier module de cette série à exiger une session (contrairement à US-07/US-08/US-09,
> publics) — premier terrain plausible pour retrouver la classe de défaut de BUG-002 et suivants.
> **Vérifié explicitement** : `ReserverCreneauBouton.tsx` utilise déjà le bon pattern à trois
> états (`token === undefined` → `null` → rendu), donc pas concerné.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-010-01 | RF-010 | Visiteur non connecté (web et mobile) | 1. Ouvrir un créneau | Lien "Connecte-toi pour réserver" affiché au lieu du bouton | Test "invite à se connecter si l'utilisateur n'a pas de session" : lien affiché | ✅ Passé |
| TC-010-02 | RF-010 | Utilisateur connecté, créneau disponible (web et mobile) | 1. Cliquer/toucher "Réserver" | Le créneau est verrouillé (`POST /api/reservations`), un compte à rebours s'affiche | Test "verrouille le créneau et affiche un compte à rebours..." : compte à rebours affiché (`9:5x`/`10:00`) | ✅ Passé |
| TC-010-03 | RF-010 | Le créneau vient d'être réservé par quelqu'un d'autre entre-temps (web et mobile) | 1. Réserver 2. L'API répond `ok: false` | Message d'erreur affiché — RF-010 exige justement d'éviter cette double réservation, donc ce refus doit être clairement communiqué | Test "affiche une erreur si le créneau vient déjà d'être réservé..." : message affiché | ✅ Passé |
| TC-010-04 | RF-010 | Réservation verrouillée, le délai (`expireA`) est déjà dépassé (web et mobile) | 1. Réserver avec un `expireA` dans le passé | Message "Le délai a expiré, ce créneau est redevenu disponible." affiché (`useCountdown` → `expired: true`) | Test "affiche un message clair quand le délai de verrouillage a expiré" ajouté : message affiché | ✅ Passé *(re-testé le 1 septembre 2026)* |
| TC-010-05 | RF-010 | Clic/appui pendant qu'une réservation est déjà en cours (web et mobile) | 1. Cliquer "Réserver" 2. Observer le bouton avant la résolution de l'appel | Le bouton est désactivé (`disabled={reserving}`) — empêche un double-clic qui enverrait deux `POST` pour le même créneau | Test "désactive le bouton \"Réserver\" pendant que la réservation est en cours" ajouté : bouton désactivé, puis réservation confirmée une fois l'appel résolu | ✅ Passé *(re-testé le 1 septembre 2026)* |

**Résumé US-10** *(à jour après comblement des 2 trous)* : 5 cas — 5 ✅ passés, 0 ❌ échoué,
0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé cette session.**

---

Périmètre : US-11 (Sprint 5) — confirmation automatique de réservation par polling. Code vérifié :
`packages/reservation-core/src/useReservationStatus.ts`, `ReservationStatusPanel` (composant
interne à `ReserverCreneauBouton.tsx`, web et mobile).

> **Note de périmètre** : le déclenchement réel d'un paiement (Wave/Orange Money/Moov Money,
> US-12 à US-14) n'existe pas encore — ce hook part du principe qu'un paiement a été initié par un
> moyen quelconque et se contente d'observer le résultat, exactement comme documenté dans son
> propre commentaire de code.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-011-01 | RF-014 | Réservation verrouillée, le paiement est validé côté backend entre-temps (web et mobile) | 1. Réserver 2. Le 1er polling renvoie `statut: 'confirmee'` | "✅ Réservation confirmée !" affiché | Test "affiche la confirmation dès que le polling détecte un paiement validé..." : message affiché | ✅ Passé |
| TC-011-02 | RF-014 | Réservation verrouillée, le paiement est refusé côté backend (web et mobile) | 1. Réserver 2. Le 1er polling renvoie `statut: 'annulee'` | "La réservation a été annulée — ce créneau est de nouveau disponible." affiché | Test "affiche un message clair si la réservation est annulée..." : message affiché | ✅ Passé |
| TC-011-03 | RF-014 | Réservation verrouillée, l'appel de polling lui-même échoue techniquement (distinct d'un paiement refusé — ici `GET /api/reservations/:id` répond `ok: false`), web et mobile | 1. Réserver 2. Le polling échoue | Message d'erreur de polling affiché, **sans faire disparaître le compte à rebours** (le statut connu reste `en_attente_paiement`) | Test "affiche une erreur de polling sans faire disparaître le compte à rebours" ajouté : les deux messages coexistent | ✅ Passé *(re-testé le 1 septembre 2026)* |
| TC-011-04 | RF-014 | Statut terminal atteint (`confirmee`/`annulee`) | 1. Atteindre un statut terminal 2. Attendre plusieurs intervalles de polling (4s chacun) | Le polling s'arrête (`clearInterval`, `useReservationStatus.ts:63-65`) — aucun appel `fetch` supplémentaire après le statut terminal | **Non exécutable avec l'infrastructure de test actuelle** : `setInterval` doit être sous horloge fictive (`vi.useFakeTimers()`) dès le montage pour que l'avance de temps ait un effet, mais `findBy*`/`waitFor` (utilisés pour l'interaction initiale "Réserver", elle-même asynchrone) restent bloqués indéfiniment sous horloge fictive (`Test timed out`, testé concrètement). Une vérification en temps réel (`await` de 12+ secondes) résoudrait le conflit mais ralentirait fortement la suite pour un seul cas ; **vérifié par lecture de code** à la place (`stopIfNeeded` teste bien `isTerminal(...) \|\| pastGracePeriod` avant `clearInterval`), sans preuve d'exécution | ⏸️ Non exécutable (limite d'infrastructure de test) |

**Résumé US-11** : 4 cas — 3 ✅ passés, 0 ❌ échoué, 1 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé cette session.**

---

Périmètre : US-12 (Sprint 6) — paiement via Wave. Code vérifié :
`packages/paiement-core/src/{useInitierPaiement,paiementApi}.ts`,
`web/src/modules/recherche/components/PaiementOperateurBouton.tsx`,
`mobile/src/modules/recherche/components/PaiementOperateurBouton.tsx`.

> **Note de périmètre** : `PaiementOperateurBouton` est déjà générique aux trois opérateurs
> (Wave/Orange Money/Moov Money, `OPERATEURS`) — le test paramétré existant vérifie incidemment
> la mécanique commune pour les trois, ce qui couvre par avance une bonne partie d'US-13/US-14
> (label affiché, payload envoyé). Cette session reste néanmoins tracée à RF-011 (Wave), les
> deux autres opérateurs méritant leur propre passage QA le moment venu pour toute nuance propre
> à chacun.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-012-01 | RF-011 | Réservation verrouillée (web et mobile) | 1. Cliquer/toucher "Payer avec Wave" | Le paiement est initié (`POST /api/paiements`), l'URL de paiement s'ouvre (nouvel onglet web / navigateur intégré mobile) | Test "ouvre l'URL de paiement Wave..."/"ouvre le navigateur intégré..." : ouverture avec la bonne URL | ✅ Passé |
| TC-012-02 | RF-011 | L'initiation échoue côté backend (web et mobile) | 1. Payer 2. L'API répond `ok: false` | Message d'erreur affiché, aucune ouverture | Test "affiche une erreur si l'initialisation du paiement échoue..." : message affiché, pas d'ouverture | ✅ Passé |
| TC-012-03 | RF-011 (mécanique commune, incidemment utile à US-13/US-14) | Les trois opérateurs (web et mobile) | 1. Payer avec chacun | Le bon label s'affiche, le bon `operateur` est envoyé dans le payload | Test paramétré `it.each(OPERATEURS)` : les trois passent | ✅ Passé |
| TC-012-04 | RF-011 | L'ouverture de la page de paiement échoue **après** une initiation réussie (popup bloqué par le navigateur côté web ; `WebBrowser.openBrowserAsync` rejette côté mobile, ex. app incapable d'ouvrir l'URL) | 1. Payer avec succès 2. L'ouverture échoue | Un message doit informer l'utilisateur que quelque chose s'est mal passé — RF-011 vise justement à ce que le paiement aboutisse "sans sortir de l'application" | **Corrigé** (voir BUG-006) : message d'erreur affiché des deux côtés ; côté web, un lien de secours `<a href={checkoutUrl}>` permet de continuer quand même. Re-testé empiriquement (web et mobile), test permanent ajouté | ✅ Passé *(re-testé le 1 septembre 2026)* |
| TC-012-05 | RF-011 | Clic/appui pendant qu'une initiation est déjà en cours (web et mobile) | 1. Payer 2. Observer le bouton avant la résolution de l'appel | Le bouton est désactivé (`disabled={initiating}`) | Test "désactive le bouton pendant que le paiement est en cours d'initiation" ajouté (web et mobile) : bouton désactivé | ✅ Passé *(re-testé le 1 septembre 2026)* |

**Résumé US-12** *(à jour après correction de BUG-006 et comblement du trou)* : 5 cas —
5 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.

---

Périmètre : US-13 (Sprint 6) — paiement via Orange Money. Même code que US-12 :
`PaiementOperateurBouton.tsx` (web et mobile) est déjà entièrement générique aux trois
opérateurs, `operateur` étant sa seule variable d'entrée.

> **Constat de conception, vérifié avant de conclure** : `handleClick`/`handlePress` ne
> contiennent **aucune branche conditionnelle sur `operateur`** — la valeur ne sert qu'à choisir
> le label affiché et à être transmise telle quelle au payload de `POST /api/paiements`. Le
> correctif de BUG-006 (vérification de l'ouverture, `openError`) opère uniquement sur `url`,
> jamais sur `operateur`. Autrement dit : il n'existe **aucun chemin de code propre à Orange
> Money** à isoler d'un test déjà passé pour Wave — même raisonnement que RF-005 (US-04, "mêmes
> modalités qu'un particulier") : la conformité est satisfaite par construction, pas par un
> comportement distinct à vérifier séparément.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-013-01 | RF-012 | Réservation verrouillée, opérateur Orange Money (web et mobile) | 1. Toucher/cliquer "Payer avec Orange Money" | Le bon label s'affiche, `POST /api/paiements` envoie `operateur: "orange_money"`, l'URL renvoyée s'ouvre | Test paramétré `it.each(OPERATEURS)` (déjà exécuté en session US-12, inclut `orange_money`) : label, payload et ouverture corrects | ✅ Passé |
| TC-013-02 | RF-012 | Toutes les variantes déjà vérifiées pour Wave (validation d'erreur d'initiation, échec d'ouverture après succès — BUG-006 —, bouton désactivé pendant l'appel) | — | Comportement identique pour Orange Money, `operateur` n'intervenant dans aucune branche de ce code | Vérifié par lecture de code (aucune branche conditionnelle sur `operateur` dans les chemins concernés) — pas de test dédié supplémentaire, un doublon n'aurait rien prouvé de plus | ✅ Passé *(satisfait par construction)* |

**Résumé US-13** : 2 cas — 2 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé** — logiquement, puisque US-13 ne fait qu'exercer un chemin de code déjà
entièrement vérifié et corrigé lors de la session US-12.

> ⚠️ **Limite importante de cette vérification (US-12/US-13/US-14)** : tout ce qui précède ne
> teste que la couche **frontend générique** (`PaiementOperateurBouton`, `useInitierPaiement`) —
> avec un mock `fetch` qui renvoie toujours la même forme de réponse (`{ paiementId, checkoutUrl }`
> ou une erreur générique), quel que soit l'opérateur. Le frontend traite volontairement les trois
> opérateurs de façon identique (voir le "Constat de conception" ci-dessus), mais **Wave, Orange
> Money et Moov Money sont trois API réelles distinctes** côté backend (formats de requête, codes
> d'erreur, délais de webhook, contraintes propres à chacune — voir `architecture.md` section 4,
> "adaptateur de paiement commun"). Rien dans cette session QA ne peut garantir que ces différences
> réelles sont correctement gérées, puisque le backend Laravel n'existe pas encore (`TODO` explicite
> dans `paiementApi.ts`). **À refaire une fois le backend implémenté** : une session QA dédiée par
> opérateur, contre le vrai comportement de chaque API (erreurs spécifiques à Wave vs Orange Money
> vs Moov Money, formats de webhook, délais réels), plutôt que contre un mock uniforme comme ici.
> Cette limite s'applique rétroactivement à la session US-12 ci-dessus, pas seulement à celle-ci.

---

Périmètre : US-14 (Sprint 6) — paiement via Moov Money. Même code, même composant générique
`PaiementOperateurBouton` que US-12/US-13 — même constat de conception (aucune branche sur
`operateur`), donc même traitement.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-014-01 | RF-013 | Réservation verrouillée, opérateur Moov Money (web et mobile) | 1. Toucher/cliquer "Payer avec Moov Money" | Le bon label s'affiche, `POST /api/paiements` envoie `operateur: "moov_money"`, l'URL renvoyée s'ouvre | Test paramétré `it.each(OPERATEURS)` (déjà exécuté en session US-12, inclut `moov_money`) : label, payload et ouverture corrects | ✅ Passé |
| TC-014-02 | RF-013 | Toutes les variantes déjà vérifiées pour Wave/Orange Money (erreur d'initiation, échec d'ouverture — BUG-006 —, bouton désactivé) | — | Comportement identique pour Moov Money | Vérifié par lecture de code (même constat que US-13, aucune branche sur `operateur`) — pas de test dédié supplémentaire | ✅ Passé *(satisfait par construction)* |

**Résumé US-14** : 2 cas — 2 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé** — même raisonnement que US-13.

> ⚠️ **Même limite que US-12/US-13, rappelée ici** : cette vérification ne porte que sur le
> frontend générique contre un mock uniforme. Les vraies différences entre Wave, Orange Money et
> Moov Money (formats d'API, codes d'erreur, webhooks) resteront à tester une fois le backend
> Laravel implémenté — voir la note détaillée dans la session US-13 ci-dessus, qui s'applique à
> l'identique ici.
>
> **Le Must have du module Paiement (US-12 à US-14) est maintenant entièrement passé en session
> QA.** Restent RF-015 (reversement, US-15) et les modules suivants du backlog.

---

Périmètre : US-15 (Sprint 7) — consultation des reversements par le propriétaire/gestionnaire.
Code vérifié : `packages/paiement-core/src/{useReversements,paiementApi}.ts`,
`web/src/modules/paiement/components/ReversementsList.tsx`,
`mobile/src/modules/paiement/screens/ReversementsScreen.tsx`.

> **Vérifié explicitement** : les deux écrans utilisent déjà le bon pattern à trois états pour le
> token (`undefined`/`null`/string), avec un commentaire qui référence directement le piège de
> BUG-002 — pas de nouvelle occurrence à corriger ici. Lecture seule (RF-015 : le reversement est
> un processus backend automatique, cet écran ne fait que le consulter, jamais le déclencher).

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-015-01 | RF-015 | Reversements existants côté backend (web et mobile) | 1. Ouvrir l'écran reversements | La liste s'affiche avec montant brut, commission, montant net et statut | Test "affiche la liste des reversements avec montant net et statut" : montant net et statut affichés | ✅ Passé |
| TC-015-02 | RF-015 | Aucun reversement (web et mobile) | 1. Ouvrir l'écran | "Aucun reversement pour l'instant." affiché | Test "affiche un message clair quand il n'y a encore aucun reversement" : message affiché | ✅ Passé |
| TC-015-03 | RF-015 | Le chargement échoue côté **web** | 1. Ouvrir l'écran 2. L'API échoue | Message d'erreur affiché | Test "affiche une erreur si le chargement échoue" : message affiché | ✅ Passé |
| TC-015-04 | RF-015 | Le chargement échoue côté **mobile** | 1. Ouvrir l'écran 2. L'API échoue | Même comportement que web | Test "affiche une erreur si le chargement échoue" ajouté à `ReversementsScreen.test.tsx` : message affiché | ✅ Passé *(re-testé le 1 septembre 2026)* |
| TC-015-05 | RF-015 | Visiteur non connecté (web et mobile) | 1. Ouvrir l'écran | Message "Connecte-toi pour voir tes reversements." affiché | Test "invite à se connecter si l'utilisateur n'a pas de session" : message affiché | ✅ Passé |
| TC-015-06 | RF-015 | Reversement encore `en_attente` (`dateReversement: null`), web et mobile | 1. Ouvrir l'écran avec un reversement en attente | La date affichée replie sur `datePaiement` (`dateReversement ?? datePaiement`) plutôt que d'afficher "null" ou de planter | Test "affiche la date de paiement en repli..." ajouté (web et mobile) : `datePaiement` affiché | ✅ Passé *(re-testé le 1 septembre 2026)* |

**Résumé US-15** *(à jour après comblement des 2 trous)* : 6 cas — 6 ✅ passés, 0 ❌ échoué,
0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé cette session.**

### Bugs — US-12

| ID bug | Cas de test | Exigence SRS | Gravité | Description | Attendu (SRS) | Observé | Statut |
|--------|--------------|----------------|----------|----------------|------------------|------------|--------|
| BUG-006 | TC-012-04 | RF-011 | Majeur | Ni `PaiementOperateurBouton.tsx` (web) ni son équivalent mobile ne vérifient si l'ouverture de la page de paiement a réellement réussi une fois l'URL obtenue : web ignore la valeur de retour de `window.open()` (qui vaut `null` si la fenêtre est bloquée), mobile `await`e `WebBrowser.openBrowserAsync()` sans jamais l'entourer d'un `try/catch` | Un joueur dont le paiement a été initié avec succès mais dont l'ouverture de la page échoue doit être informé et pouvoir réessayer | **Corrigé le 1 septembre 2026** : web vérifie désormais la valeur de retour de `window.open()` et affiche un message **avec un lien de secours** (`<a href={checkoutUrl}>Continuer vers le paiement</a>`) si l'ouverture échoue ; mobile entoure `WebBrowser.openBrowserAsync()` d'un `try/catch` qui alimente un nouvel état `openError`. Re-vérifié par le même test empirique qui avait révélé le bug (message affiché des deux côtés) et par un test permanent ajouté aux deux suites | ✅ Corrigé |

**Note sur BUG-006** : gravité "Majeur" — ce n'est pas un simple défaut d'affichage, c'est un
**cul-de-sac silencieux dans le parcours de paiement**, le chemin critique de toute l'application
(RNF-005 vise justement 99,5 % de disponibilité sur ce chemin). Un popup bloqué par défaut est un
scénario courant (beaucoup de navigateurs bloquent les popups hors interaction directe, et
certains bloquent même dans un gestionnaire de clic selon leurs réglages) — ce n'est pas un cas
exotique. Correctif suggéré : vérifier la valeur de retour de `window.open()` (afficher un message
avec un lien de secours si `null`) et entourer `WebBrowser.openBrowserAsync()` d'un `try/catch`
qui alimente `initiateError` (ou un état dédié) en cas d'échec.

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

### Session du 31 août 2026 (US-07 / RF-007+RF-008 — recherche par sport/localisation/date)
- Périmètre testé : US-07 (Sprint 4), strictement RF-007 (sport, localisation) et RF-008 (date,
  heure) — US-09 (proximité) et US-23 (prix/distance/équipements) partagent les mêmes fichiers
  mais restent hors périmètre de cette session, cohérent avec le découpage du backlog.
- 8 cas de test — 4 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 4 ◻️ non couverts.
- **Aucun bug trouvé** — première session QA du Must have sans découverte de défaut, cohérent
  avec le fait que ce module est public (pas de lecture de session au montage), donc à l'abri de
  la classe de défaut éliminée par `useSessionToken`.
- **Écarts de parité web/mobile signalés** : la localisation et la date ne sont testées que côté
  web (dans un test combiné avec le sport) ; aucune plateforme ne teste le paramètre `heure`.
- **Recommandation** : combler les 4 trous — candidats à faible coût, même profil que les gaps
  déjà comblés dans les sessions précédentes.

### Session du 31 août 2026 (comblement des 4 trous US-07)
- **4 trous comblés** : `TC-007-04` (localisation, mobile), `TC-007-05` (date, mobile),
  `TC-007-06` (heure, web et mobile) — 1 test ajouté côté web, 3 côté mobile.
- Ré-exécution complète : web 109/109 verts, mobile 107/107 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-07 / RF-007+RF-008 est maintenant intégralement couvert et conforme, sans cas non
  exécutable ni bug ouvert.**

### Session du 31 août 2026 (US-08 / RF-009 — consultation d'une annonce)
- Périmètre testé : US-08 (Sprint 4), RF-009 — `ReserverCreneauBouton` (US-10) intégré dans ces
  écrans mais hors périmètre, pas encore passé en session QA.
- 8 cas de test — 3 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 5 ◻️ non couverts.
- **Aucun bug trouvé** — deuxième session consécutive sans défaut, cohérent avec le caractère
  public du module.
- **Observation signalée (pas un bug)** : le message de secours "Cette annonce n'existe pas..."
  semble être du code mort — `useTerrainDetail` ne produit jamais l'état (`error` vide ET
  `detail` vide) qui le déclencherait. Aucun impact utilisateur constaté, donc pas remonté comme
  défaut, juste noté pour information.
- **Écart de parité web/mobile signalé** : "absence de note" testée côté web mais pas mobile —
  cinquième occurrence de ce type d'écart depuis le début de la QA.
- **4 autres trous** : tous des cas limites de rendu conditionnel jamais exercés (aucun créneau,
  aucune photo, aucun équipement, type absent) — aucun ne semble à risque à la lecture du code
  (rendu conditionnel simple, `.length > 0` ou vérité directe), mais rien ne le prouve sans test.
- **Recommandation** : combler les 5 trous, faible risque mais faible coût aussi.

### Session du 31 août 2026 (comblement des 5 trous US-08)
- **5 trous comblés** : `TC-008-04` (absence de note, parité mobile), `TC-008-05` (aucun créneau
  disponible), `TC-008-06` (aucune photo), `TC-008-07` (aucun équipement), `TC-008-08` (type
  absent) — tous testés sur les deux plateformes.
- Ré-exécution complète : web 113/113 verts, mobile 112/112 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression, et les 4 cas limites de rendu conditionnel confirment ne pas
  planter comme attendu à la lecture du code.
- **US-08 / RF-009 est maintenant intégralement couvert et conforme, sans cas non exécutable ni
  bug ouvert.**

### Session du 31 août 2026 (US-09 / RF-007 — tri par proximité)
- Périmètre testé : US-09 (Sprint 4), extension "proximité" de RF-007 — le reste de RF-007 est
  déjà couvert par la session US-07.
- 6 cas de test — 2 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 4 ◻️ non couverts.
- **Aucun bug trouvé** — troisième session consécutive sans défaut.
- **4 trous de couverture, tous sur les chemins d'échec de la géolocalisation** (jamais simulés
  jusqu'ici) : géolocalisation indisponible (web), acquisition refusée/échouée (web), permission
  refusée (mobile), échec inattendu de l'acquisition (mobile).
- **Recommandation** : combler les 4 trous — ce sont des chemins d'erreur réels (permission
  refusée par l'utilisateur est un cas courant en pratique), pas des cas limites théoriques.

### Session du 1 septembre 2026 (comblement des 4 trous US-09)
- **4 trous comblés** : `TC-009-03` (géolocalisation indisponible, web), `TC-009-04` (acquisition
  refusée/échouée, web), `TC-009-05` (permission refusée, mobile), `TC-009-06` (échec inattendu
  de l'acquisition, mobile).
- Ré-exécution complète : web 115/115 verts, mobile 114/114 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-09 / RF-007 (proximité) est maintenant intégralement couvert et conforme, sans cas non
  exécutable ni bug ouvert.**

### Session du 1 septembre 2026 (US-10 / RF-010 — sélection et initiation d'une réservation)
- Périmètre testé : US-10 (Sprint 5), strictement RF-010 (sélection, verrouillage, expiration) —
  les statuts pilotés par polling (confirmée/annulée) relèvent d'US-11/RF-014, hors périmètre.
- Premier module de la série à exiger une session — vérifié explicitement que
  `ReserverCreneauBouton` utilise déjà le bon pattern à trois états pour le token (pas
  d'occurrence supplémentaire de BUG-002 et suivants à corriger ici).
- 5 cas de test — 3 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 2 ◻️ non couverts.
- **Aucun bug trouvé.**
- **2 trous de couverture** : expiration du délai de verrouillage (tous les tests existants
  utilisent un `expireA` dans le futur), et absence de test sur la désactivation du bouton
  pendant une réservation en cours (protection anti double-clic, pertinente vu que RF-010 vise
  justement à éviter une double réservation).
- **Recommandation** : combler les 2 trous, puis prévoir une session QA dédiée à US-11 (RF-014)
  pour les statuts confirmée/annulée pilotés par polling, déjà testés mais jamais audités comme
  tels.

### Session du 1 septembre 2026 (comblement des 2 trous US-10)
- **2 trous comblés** : `TC-010-04` (expiration du délai — `expireA` dans le passé, dans la marge
  de grâce du polling pour rester réaliste) et `TC-010-05` (bouton désactivé pendant l'appel, avec
  résolution différée de la promesse `fetch` pour simuler l'attente).
- Un avertissement `act(...)` a été rencontré puis corrigé pendant l'écriture de `TC-010-05` côté
  web (la résolution de la promesse après la fin du test provoquait une mise à jour d'état hors
  `act()`) — corrigé en attendant la retombée du re-rendu (`findByText`) avant la fin du test.
- Ré-exécution complète : web 117/117 verts, mobile 116/116 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-10 / RF-010 est maintenant intégralement couvert et conforme, sans cas non exécutable ni
  bug ouvert.**

### Session du 1 septembre 2026 (US-11 / RF-014 — confirmation automatique de réservation)
- Périmètre testé : US-11 (Sprint 5), le polling de statut (`useReservationStatus`) déjà
  identifié comme hors périmètre de la session US-10.
- 4 cas de test — 3 ✅ passés (dont 1 nouveau, l'erreur de polling), 0 ❌ échoué,
  1 ⏸️ non exécutable, 0 ◻️ non couvert.
- **Aucun bug trouvé.**
- **1 cas non exécutable, documenté honnêtement plutôt que forcé** : vérifier que le polling
  s'arrête après un statut terminal demande une horloge fictive dès le montage, mais
  `findBy*`/`waitFor` (nécessaires pour l'interaction "Réserver" initiale, elle-même
  asynchrone) restent bloqués sous horloge fictive — testé concrètement, `Test timed out`
  confirmé. Vérifié par lecture de code à la place (logique correcte à l'inspection), sans
  prétendre que c'est équivalent à une preuve d'exécution.
- Ré-exécution complète : web 118/118 verts, mobile 117/117 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-11 / RF-014 est couvert dans la mesure du possible avec l'infrastructure de test
  actuelle.** Le seul cas restant nécessiterait soit un vrai délai de test (~12s, jugé trop
  coûteux pour un seul cas), soit un refactor de `useReservationStatus` pour rendre l'intervalle
  injectable/testable plus facilement — à considérer si ce comportement devient critique.
- **Décision utilisateur** : `TC-011-04` accepté tel quel comme non exécutable, documenté dans le
  rapport — pas de refactor entrepris pour le rendre testable.

### Session du 1 septembre 2026 (US-12 / RF-011 — paiement via Wave)
- Périmètre testé : US-12 (Sprint 6), RF-011. `PaiementOperateurBouton` étant déjà générique aux
  trois opérateurs, le test paramétré existant couvre par avance une partie mécanique d'US-13/14.
- 5 cas de test — 3 ✅ passés, 1 ❌ échoué, 0 ⏸️ non exécutable, 1 ◻️ non couvert.
- **1 bug ouvert : BUG-006 (Majeur)** — ni le web ni le mobile ne détectent un échec d'ouverture
  de la page de paiement après une initiation pourtant réussie (popup bloqué côté web,
  `WebBrowser.openBrowserAsync` qui rejette sans `try/catch` côté mobile) : l'utilisateur se
  retrouve devant un bouton qui redevient cliquable sans le moindre message, alors que le
  paiement est resté "initié" côté backend. Reproduit empiriquement sur les deux plateformes.
  Contrairement aux bugs précédents (tous liés au pattern du token), celui-ci touche directement
  le chemin critique paiement/réservation (RNF-005).
- **1 trou de couverture** : désactivation du bouton pendant l'initiation en cours.
- **Recommandation** : corriger BUG-006 en priorité (chemin critique), puis combler le trou
  restant.

### Session du 1 septembre 2026 (correction de BUG-006 et comblement du trou US-12)
- **BUG-006 corrigé, avec un vrai chemin de récupération plutôt qu'un simple message** :
  - **Web** : la valeur de retour de `window.open()` est maintenant vérifiée ; si elle est
    `null` (popup bloqué), un message s'affiche **avec un lien `<a href={checkoutUrl}>`** pour
    que l'utilisateur puisse continuer quand même, plutôt qu'un message d'erreur sans issue.
  - **Mobile** : `WebBrowser.openBrowserAsync()` est désormais entouré d'un `try/catch` qui
    alimente un nouvel état `openError`, affiché comme les autres erreurs du composant. Pas de
    lien de secours équivalent au web ici (contrainte de plateforme — pas d'élément `<a>`
    naturel), mais le bouton reste disponible pour réessayer.
  - Les deux corrections utilisent un état `openError` séparé de `initiateError` du hook
    (`useInitierPaiement` reste inchangé, il ignore toujours comment son URL est ouverte, comme
    documenté dans son propre commentaire) — l'échec d'ouverture est un problème différent de
    l'échec d'initiation.
- **Trou comblé** : `TC-012-05` (bouton désactivé pendant l'initiation), web et mobile.
- Ré-exécution complète : web 120/120 verts, mobile 119/119 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-12 / RF-011 est maintenant intégralement couvert et conforme, sans cas non exécutable ni
  bug ouvert.**

### Session du 1 septembre 2026 (US-13 / RF-012 — paiement via Orange Money)
- Périmètre testé : US-13 (Sprint 6), RF-012 — même composant générique que US-12
  (`PaiementOperateurBouton`), sans aucune branche de code propre à `operateur`.
- 2 cas de test — 2 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.
- **Aucun bug trouvé** — attendu, puisque le code exercé est identique à celui déjà vérifié et
  corrigé (BUG-006) en session US-12.
- **Décision méthodologique explicite** : pas de duplication de tous les tests de US-12 avec
  `operateur: 'orange_money'` — vérifié d'abord par lecture de code qu'aucune branche
  conditionnelle sur `operateur` n'existe dans les chemins concernés, donc un doublon n'aurait
  rien prouvé de plus que ce que le test paramétré `it.each(OPERATEURS)` prouve déjà. Même
  raisonnement que pour RF-005 (US-04).
- **US-13 / RF-012 est intégralement couvert et conforme par cette analyse — pas de session de
  correctifs nécessaire.**
- **Limite signalée à l'utilisateur et documentée dans le rapport (section 1)** : cette
  vérification (US-12/US-13/US-14) ne couvre que la couche frontend générique, contre un mock
  `fetch` uniforme — elle ne prouve rien sur les différences réelles entre les API Wave, Orange
  Money et Moov Money (formats, codes d'erreur, webhooks propres à chacune), puisque le backend
  Laravel n'existe pas encore. Une session QA dédiée par opérateur contre le vrai backend sera
  nécessaire une fois celui-ci implémenté — pas un travail à faire maintenant, mais à ne pas
  oublier au moment venu.

### Session du 1 septembre 2026 (US-14 / RF-013 — paiement via Moov Money)
- Périmètre testé : US-14 (Sprint 6), RF-013 — même composant générique, même constat de
  conception que US-13 (aucune branche de code sur `operateur`).
- 2 cas de test — 2 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.
- **Aucun bug trouvé** — attendu, même raisonnement que US-13.
- Même limite rappelée : vérification frontend uniquement, contre un mock uniforme — les vraies
  différences entre les trois API opérateurs restent à tester une fois le backend Laravel
  disponible (cf. note détaillée en session US-13).
- **Le Must have du module Paiement (US-12 à US-14) est désormais entièrement passé en session
  QA**, sans bug ouvert. Reste US-15 (RF-015, reversement) pour clore le module Paiement.

### Session du 1 septembre 2026 (US-15 / RF-015 — reversement au propriétaire/gestionnaire)
- Périmètre testé : US-15 (Sprint 7), dernière story du module Paiement.
- Vérifié explicitement que `ReversementsList`/`ReversementsScreen` utilisent déjà le bon
  pattern à trois états pour le token (commentaire référençant directement BUG-002) — pas de
  nouvelle occurrence à corriger.
- 6 cas de test — 4 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 2 ◻️ non couverts.
- **Aucun bug trouvé.**
- **Écart de parité web/mobile signalé** : l'erreur de chargement est testée côté web mais pas
  côté mobile.
- **1 trou de couverture propre à cette story** : le repli `dateReversement ?? datePaiement`
  pour un reversement encore `en_attente` — présent dans les données de test web mais jamais
  vérifié pour de vrai, absent des données de test mobile.
- **Recommandation** : combler les 2 trous, puis clore le module Paiement (US-12 à US-15 tous
  passés en session QA).

### Session du 1 septembre 2026 (comblement des 2 trous US-15)
- **2 trous comblés** : `TC-015-04` (erreur de chargement, parité mobile) et `TC-015-06` (repli
  `dateReversement ?? datePaiement` pour un reversement en attente, web et mobile — nouvelle
  donnée de test `REVERSEMENT_EN_ATTENTE` ajoutée côté mobile, absente jusqu'ici).
- Ré-exécution complète : web 121/121 verts, mobile 121/121 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-15 / RF-015 est maintenant intégralement couvert et conforme, sans cas non exécutable ni
  bug ouvert.** Le module Paiement (US-12 à US-15) est donc entièrement clos en session QA.

### Session du 1 septembre 2026 (US-16 / RF-016 — notation post-session)
- Périmètre testé : US-16 (Sprint 7), RF-016 — `NoteMoyenneBadge` (RF-017) embarqué mais hors
  périmètre, à couvrir par une session US-17.
- Vérifié explicitement que le pattern à trois états du token est déjà correct des deux côtés.
- 7 cas de test — 4 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 3 ◻️ non couverts.
- **Aucun bug trouvé.**
- **3 trous de couverture** : invite à se connecter pour un visiteur non connecté (le pattern
  standard testé partout ailleurs dans le projet, absent ici), envoi réussi sans commentaire
  (le caractère "optionnel" du commentaire, RF-016, n'est jamais prouvé isolément — le seul test
  d'envoi réussi en inclut toujours un), bouton désactivé pendant l'envoi.
- **Recommandation** : combler les 3 trous, puis enchaîner sur US-17 (RF-017, note moyenne).

### Session du 1 septembre 2026 (comblement des 3 trous US-16)
- **3 trous comblés** : `TC-016-05` (invite à se connecter), `TC-016-06` (envoi sans commentaire
  — payload vérifié : la clé `commentaire` est absente plutôt qu'envoyée `null`/vide),
  `TC-016-07` (bouton désactivé pendant l'envoi).
- Un premier essai de `TC-016-06` a révélé que le payload omet entièrement la clé `commentaire`
  quand il est vide (`JSON.stringify` élimine les valeurs `undefined`) plutôt que d'envoyer
  `null` comme supposé initialement — l'assertion a été corrigée en conséquence après avoir vu
  l'échec, pas devinée à l'avance.
- Ré-exécution complète : web 124/124 verts, mobile 124/124 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-16 / RF-016 est maintenant intégralement couvert et conforme, sans cas non exécutable ni
  bug ouvert.**

### Session du 1 septembre 2026 (US-17 / RF-017 — affichage de la note moyenne)
- Périmètre testé : US-17 (Sprint 7), `NoteMoyenneBadge` — dernière story du module Notation &
  Réputation.
- 3 cas de test — 3 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.
- **Aucun bug trouvé, mais une ambiguïté de conception signalée puis arbitrée** : un échec
  technique de chargement de la note affiche le même message ("Pas encore de note") qu'une
  absence réelle d'avis, sur les deux plateformes — reproduit empiriquement, pas seulement lu
  dans le code. Signalé pour arbitrage plutôt que tranché unilatéralement ; un test permanent
  verrouille le comportement.
- **Arbitrage (2 septembre 2026, utilisateur)** : compromis assumé pour ce badge minimaliste,
  conservé tel quel — pas de message distinct à ajouter pour le cas d'échec technique.
- Ré-exécution complète : web 125/125 verts, mobile 125/125 verts, `tsc --noEmit` propre des deux
  côtés.
- **US-17 / RF-017 est intégralement couvert.** Avec cette session, **le module Notation &
  Réputation (US-16/US-17) est entièrement clos en QA.**

---

Périmètre : US-17 (Sprint 7) — affichage de la note moyenne (`NoteMoyenneBadge`, module Notation
& Réputation). Code vérifié : `packages/notation-core/src/useNoteMoyenne.ts`,
`web/src/modules/notation/components/NoteMoyenneBadge.tsx`,
`mobile/src/modules/notation/components/NoteMoyenneBadge.tsx`. Composant public (pas de token),
déjà exercé incidemment dans les sessions US-16 (embarqué dans `NotationForm`/`NotationScreen`).

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-017-01 | RF-017 | Utilisateur avec des avis (web et mobile) | 1. Afficher le badge | La note moyenne et le nombre d'avis s'affichent | Test "affiche la note moyenne et le nombre d'avis" : `4.5 / 5 (12 avis)` affiché | ✅ Passé |
| TC-017-02 | RF-017 | Utilisateur sans aucun avis (`moyenne: null`), web et mobile | 1. Afficher le badge | "Pas encore de note" affiché | Test "affiche \"Pas encore de note\" si aucun avis" : message affiché | ✅ Passé |
| TC-017-03 | RF-017 | Le chargement de la note échoue techniquement (web et mobile) | 1. Afficher le badge 2. L'API échoue | *(voir note ci-dessous)* | **Reproduit empiriquement** : le composant affiche **le même texte "Pas encore de note"** qu'en l'absence réelle d'avis (`error \|\| !noteMoyenne \|\| noteMoyenne.moyenne === null`, une seule branche pour les deux cas). Test permanent ajouté pour verrouiller ce comportement | ✅ Passé *(comportement confirmé et verrouillé par test, voir note)* |

**Résumé US-17** : 3 cas — 3 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug — ambiguïté de conception signalée puis arbitrée** : `NoteMoyenneBadge` affiche le
texte "Pas encore de note" aussi bien pour un utilisateur réellement sans avis que pour un échec
technique de chargement — les deux cas partagent la même condition de rendu (`error || !noteMoyenne
|| noteMoyenne.moyenne === null`), sur les deux plateformes. **Arbitrage (1 septembre 2026,
utilisateur) : compromis assumé pour ce badge, conservé tel quel.** Le message unique reste
volontaire pour un composant minimaliste — pas de message distinct à ajouter pour le cas d'échec
technique. Le test permanent qui verrouille ce comportement (`NoteMoyenneBadge.test.tsx`, cas
"comportement actuel") reste donc l'expression exacte du comportement voulu, pas un pense-bête
temporaire en attente d'un correctif.

---

Périmètre : US-16 (Sprint 7) — notation d'une session (module Notation & Réputation). Code
vérifié : `packages/notation-core/src/{useNoterSession,notationApi}.ts`,
`web/src/modules/notation/components/NotationForm.tsx`,
`mobile/src/modules/notation/screens/NotationScreen.tsx`.

> **Note de périmètre** : ces deux écrans embarquent aussi `NoteMoyenneBadge` (RF-017, affichage
> de la note moyenne de la cible) — hors périmètre ici, à couvrir par une session US-17 dédiée.
> **Vérifié explicitement** : le pattern à trois états du token est déjà correct des deux côtés,
> pas de nouvelle occurrence de BUG-002 à corriger.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-016-01 | RF-016 | Réservation terminée, utilisateur connecté (web et mobile) | 1. Ouvrir l'écran de notation | Le formulaire s'affiche avec la note actuelle de la cible | Test "affiche la note actuelle de la cible" : note affichée | ✅ Passé |
| TC-016-02 | RF-016 | Aucune note sélectionnée (web et mobile) | 1. Cliquer/toucher "Envoyer ma note" sans sélectionner de note | Erreur "Sélectionne une note entre 1 et 5." affichée, aucun appel `POST` | Test "affiche une erreur si aucune note n'est sélectionnée" : erreur affichée, `POST` jamais appelé | ✅ Passé |
| TC-016-03 | RF-016 | Note et commentaire renseignés (web et mobile) | 1. Sélectionner une note 2. Saisir un commentaire 3. Envoyer | Confirmation "Merci, ta note a bien été enregistrée." affichée | Test "envoie la notation et affiche une confirmation" : confirmation affichée | ✅ Passé |
| TC-016-04 | RF-016 | L'envoi échoue côté backend (web et mobile) | 1. Sélectionner une note 2. Envoyer 3. L'API répond `ok: false` | Message d'erreur affiché | Test "affiche une erreur si l'envoi échoue" : message affiché | ✅ Passé |
| TC-016-05 | RF-016 | Visiteur non connecté (web et mobile) | 1. Ouvrir l'écran de notation | Message "Connecte-toi pour laisser une note." affiché | Test "invite à se connecter si l'utilisateur n'a pas de session" ajouté : message affiché | ✅ Passé *(re-testé le 1 septembre 2026)* |
| TC-016-06 | RF-016 | Note sélectionnée, **aucun commentaire saisi** (web et mobile) | 1. Sélectionner une note 2. Envoyer sans commentaire | RF-016 précise "commentaire optionnel" : l'envoi doit aboutir sans commentaire | Test "envoie la notation sans commentaire..." ajouté : confirmation affichée, la clé `commentaire` est absente du payload (`commentaire.trim() \|\| undefined`, éliminée par `JSON.stringify`) | ✅ Passé *(re-testé le 1 septembre 2026)* |
| TC-016-07 | RF-016 | Clic/appui pendant que l'envoi est déjà en cours (web et mobile) | 1. Envoyer 2. Observer le bouton avant la résolution de l'appel | Le bouton est désactivé (`disabled={submitting}`) | Test "désactive le bouton \"Envoyer ma note\"..." ajouté : bouton désactivé, confirmation affichée une fois l'appel résolu | ✅ Passé *(re-testé le 1 septembre 2026)* |

**Résumé US-16** *(à jour après comblement des 3 trous)* : 7 cas — 7 ✅ passés, 0 ❌ échoué,
0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé cette session.**

---

### Session du 2 septembre 2026 (US-18 / RF-018 — historique des réservations, joueur)
- Périmètre testé : US-18 (Sprint 8), `HistoriqueList`/`HistoriqueScreen` — strictement le rôle
  `joueur` (RF-018 : "consulter l'historique de ses réservations passées et à venir"). RF-019
  (rôle `proprietaire`, US-19), RF-021 (annulation, US-22), RF-023 (messagerie, US-24) et le lien
  "Noter cette session" (RF-016, US-16) sont embarqués dans le même fichier mais **hors périmètre
  ici** — déjà couverts par leurs propres cas de test, à valider dans leurs sessions dédiées.
- Ce fichier ne rejoue pas le pattern à trois états du token en flash cosmétique (`ProfileForm`) ni
  en soumission silencieusement perdue (`CreateTerrainForm`) : `HistoriqueList` gate déjà tout le
  rendu sur `token === undefined || loading`, correctement — **aucune nouvelle occurrence de
  BUG-002 à corriger.**
- 5 cas de test — 4 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, **1 ◻️ non couvert**.
- **1 trou de couverture identifié** : aucun test n'exerce l'échec du chargement principal de
  l'historique (`GET /api/reservations/mes-reservations` répondant `ok: false`) — contrairement
  aux listes sœurs déjà testées dans ce projet (`ReversementsList`, US-15 ; les écrans de
  notification). Le message d'erreur existe pourtant déjà côté code
  (`packages/historique-core/src/historiqueApi.ts:24`, "Impossible de charger ton historique.
  Réessaie plus tard.", affiché par `HistoriqueList.tsx`/`HistoriqueScreen.tsx` via
  `error && reservations.length === 0`) — rien ne l'empêche d'être testé, ce n'est pas un cas
  "Non exécutable".
- Suite exécutée pour de vrai : web `npx vitest run HistoriqueList` → 9/9 verts ; mobile
  `npx jest HistoriqueScreen` → 9/9 verts (après re-préfixage explicite du `cd`, la première
  tentative ayant tourné dans le mauvais répertoire — récurrence déjà documentée dans ce rapport).
- **US-18 / RF-018 n'est pas encore intégralement clos** : 1 trou à combler avant de considérer la
  story fermée.

### Session du 2 septembre 2026 (comblement du trou US-18)
- **1 trou comblé** : `TC-018-05` (échec du chargement principal de l'historique, web et mobile) —
  même pattern que celui déjà comblé pour `ReversementsList` (US-15).
- Ré-exécution complète : web 126/126 verts, mobile 126/126 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-18 / RF-018 est maintenant intégralement couvert et conforme, sans cas non exécutable ni
  bug ouvert.**

### Session du 2 septembre 2026 (US-19 / RF-019 — historique des réservations, propriétaire)
- Périmètre testé : US-19 (Sprint 8), `HistoriqueList`/`HistoriqueScreen` — strictement le rôle
  `proprietaire` (RF-019 : "consulter l'historique des réservations reçues... afin de suivre son
  activité et ses revenus"). Fichier partagé avec US-18 (déjà clos), US-22/US-24 (hors périmètre,
  déjà couverts par leurs propres sessions).
- **Vérification réelle, pas "satisfait par construction" en bloc** : contrairement aux paires
  US-13/14, ce composant branche effectivement sur `role` (`TITRES`, `fetchHistorique`,
  `AUTRE_PARTIE_LABELS`, la gate `role === 'joueur'` sur le bouton d'annulation) — chacun de ces
  points a donc été vérifié pour de vrai côté `proprietaire`. Seules les branches où le code lu ne
  contient **aucune** référence à `role` (liste vide, non connecté, échec de chargement) ont été
  traitées comme satisfaites par construction, en le disant explicitement plutôt qu'en l'omettant.
- 6 cas de test — 5 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, **1 ◻️ non couvert**.
- **1 trou de couverture identifié** : RF-019 vise explicitement "qui a réservé... et quand... afin
  de suivre mon activité **et mes revenus**" — mais aucun test existant (rôle confondu, pas
  seulement `proprietaire`) n'affirme que le nom de l'autre partie avec son étiquette ("Joueur :"),
  la date du créneau, ou le montant sont bien rendus à l'écran. Les fixtures de test définissent
  ces valeurs (`autrePartie.nom`, `creneau.debut`/`fin`, `montant`) mais aucune assertion ne
  vérifie qu'elles apparaissent dans le rendu — seul le nom seul (`/awa diallo/i`) sert de point
  d'ancrage `findByText` dans d'autres tests, jamais le contenu complet de la ligne d'information.
- Suite exécutée pour de vrai (comme évidence des cas ✅) : web `npx vitest run HistoriqueList` et
  mobile `npx jest HistoriqueScreen` — même exécution que la session US-18, aucun nouveau test
  requis pour les cas déjà couverts par les tests `it.each`/annulation existants.
- **US-19 / RF-019 n'est pas encore intégralement clos** : 1 trou à combler avant de considérer la
  story fermée.

### Session du 2 septembre 2026 (comblement du trou US-19)
- **1 trou comblé** : `TC-019-02` (nom + étiquette de l'autre partie, créneau, montant réellement
  affirmés à l'écran, web et mobile) — jusqu'ici seul le nom brut de l'autre partie servait
  d'ancrage `findByText` dans les autres tests, jamais le reste de la ligne d'information.
- Ré-exécution complète : web 127/127 verts, mobile 127/127 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-19 / RF-019 est maintenant intégralement couvert et conforme, sans cas non exécutable ni
  bug ouvert. Le module Historique (US-18/US-19) est entièrement clos en QA.**

### Session du 2 septembre 2026 (US-20 / RF-020 — notifications de confirmation de réservation)
- Périmètre testé : US-20 (Sprint 8), `NotificationsList`/`NotificationsScreen` — strictement le
  volet "confirmation d'une réservation" de RF-020 (premier **Should have** testé). RF-020 a un
  second volet ("rappeler au joueur son créneau à l'approche de l'horaire") couvert par le même
  mécanisme mais attribué à US-21 dans le backlog — **hors périmètre ici**, avec le hook mobile
  `usePushRegistration` (enregistrement du jeton push), également attribué à US-21. Les deux
  seront vérifiés dans une session dédiée.
- Aucune nouvelle occurrence de BUG-002 : les deux écrans gatent déjà correctement sur
  `token === undefined || loading`.
- 9 cas de test — 4 ✅ passés, 0 ❌ échoué, 2 ⏸️ non exécutables, **3 ◻️ non couverts**.
- **3 trous de couverture identifiés** :
  1. Aucun test n'exerce l'échec du chargement principal des notifications (`ok: false`) — même
     trou déjà rencontré et comblé pour l'historique (US-18) et les reversements (US-15).
  2. Aucun test ne vérifie le comportement volontaire en cas d'échec du marquage comme lue : le
     code (`useNotifications.ts:70-72`) avale l'erreur sans en informer l'utilisateur ("marquage
     non critique... la notification reste simplement affichée comme non lue") — un choix de
     conception assumé, mais jamais verrouillé par un test comme l'a été le cas analogue de
     `NoteMoyenneBadge` (TC-017-03).
  3. **Trou de parité mobile** : le test "invite à se connecter si l'utilisateur n'a pas de
     session" existe côté web (`NotificationsList.test.tsx`) mais n'a pas d'équivalent dans
     `NotificationsScreen.test.tsx` (mobile) — vérifié en relisant le fichier mobile en entier
     (4 tests seulement : affichage, marquage lu, liste vide, enregistrement du jeton push).
- **2 cas ⏸️ non exécutables** : RF-020 exige que la notification de confirmation atteigne "le
  joueur ET le propriétaire/gestionnaire" et que l'envoi effectif (push/SMS/email) se déclenche
  "à la confirmation d'une réservation" — les deux sont entièrement pilotés par le backend
  (destinataires, déclenchement), qui n'existe pas dans ce dépôt ; le frontend se contente
  d'afficher un journal déjà peuplé (`notificationApi.ts` : "TODO: endpoints backend à
  confirmer/implémenter côté Laravel").
- Suite exécutée pour de vrai : web `npx vitest run NotificationsList` → 4/4 verts ; mobile
  `npx jest NotificationsScreen` → 4/4 verts.
- **US-20 / RF-020 (volet confirmation) n'est pas encore intégralement clos** : 3 trous à combler.

### Session du 2 septembre 2026 (comblement des 3 trous US-20)
- **3 trous comblés** : `TC-020-05` (échec du chargement principal, web et mobile — même pattern
  que l'historique/les reversements), `TC-020-06` (échec silencieux du marquage comme lue,
  comportement volontaire désormais verrouillé par un test, web et mobile), `TC-020-07` (parité
  mobile du cas "non connecté", absent jusqu'ici de `NotificationsScreen.test.tsx`).
- Ré-exécution complète : web 129/129 verts, mobile 130/130 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-20 / RF-020 (volet confirmation) est maintenant intégralement couvert et conforme**, sans
  bug ouvert. Les 2 seuls cas restants (TC-020-08/09) sont ⏸️ non exécutables par nature — dépendants
  d'un backend réel absent de ce dépôt, pas d'un trou de test.

### Session du 2 septembre 2026 (US-21 / RF-020 — rappel de créneau et enregistrement push)
- Périmètre testé : US-21 (Sprint 8/14) — le second volet de RF-020 ("rappeler au joueur son
  créneau à l'approche de l'horaire réservé", `type: 'rappel_creneau'`) et la spécificité mobile
  qui l'accompagne, `usePushRegistration` (permission + enregistrement du jeton `expo-notifications`
  auprès du backend, sans quoi aucun push FCM n'est délivrable). Même fichier que US-20 côté
  affichage ; nouveau fichier `mobile/src/modules/notifications/hooks/usePushRegistration.ts` +
  `packages/notification-core/src/useEnregistrerPushToken.ts` côté enregistrement.
- 5 cas de test — 2 ✅ passés, 0 ❌ échoué, 1 ⏸️ non exécutable, **2 ◻️ non couverts**.
- **2 trous de couverture identifiés** :
  1. **Parité mobile** : le web teste déjà l'affichage d'une notification `rappel_creneau` (test
     "affiche les notifications de confirmation et de rappel", `NotificationsList.test.tsx`) mais
     `NotificationsScreen.test.tsx` (mobile) n'utilise jamais que la fixture `NOTIF_CONFIRMATION`
     — le type "rappel" n'est jamais exercé côté mobile.
  2. Le cas où la permission push est **refusée** par l'utilisateur n'est testé sur aucune des deux
     plateformes : le code (`usePushRegistration.ts:50-53`) prévoit explicitement ce chemin
     ("l'utilisateur a refusé : rien à enregistrer, mais ce n'est pas une erreur applicative") mais
     rien ne vérifie qu'aucun enregistrement n'est tenté et qu'aucune erreur n'apparaît dans ce cas.
- **Observation signalée pour arbitrage (pas un ❌ formel — le SRS ne l'exige pas explicitement)** :
  `NotificationsScreen.tsx:33` appelle `usePushRegistration(...)` sans jamais utiliser sa valeur de
  retour — `registerError` (et `registering`) ne peuvent donc jamais atteindre l'utilisateur, quel
  que soit le résultat de l'enregistrement. Un échec est réessayé silencieusement à chaque nouvelle
  visite de l'écran (l'effet se redéclenche au remontage), donc pas un cul-de-sac total comme
  BUG-006 ; mais actuellement rien ne distingue "jeton enregistré avec succès" de "l'enregistrement
  a échoué et personne ne le saura" — ce qui, si l'échec persiste, prive silencieusement l'objectif
  même de US-21 ("recevoir un rappel... afin de ne pas l'oublier") côté push, sans jamais recourir
  au journal in-app (US-20) pour compenser puisque l'utilisateur n'a aucune raison de soupçonner un
  problème. Pas de cas de test formel créé pour ce point — signalé pour décision plutôt que tranché
  unilatéralement, comme pour l'ambiguïté US-17.
- **1 cas ⏸️ non exécutable** : le déclenchement effectif du rappel "à l'approche de l'horaire" est
  un mécanisme de planification entièrement backend (cron/scheduler), absent de ce dépôt — rien à
  observer côté frontend seul.
- Suite exécutée pour de vrai : web `npx vitest run NotificationsList` → 6/6 verts ; mobile
  `npx jest NotificationsScreen` → 7/7 verts.
- **US-21 / RF-020 n'est pas encore intégralement clos** : 2 trous à combler, et une observation en
  attente d'arbitrage utilisateur.

### Session du 2 septembre 2026 (correction de BUG-007 et comblement des 2 trous US-21)
- **Arbitrage (2 septembre 2026, utilisateur)** : correction demandée pour l'observation signalée
  — contrairement au compromis assumé pour US-17, l'échec silencieux de l'enregistrement du jeton
  push est désormais visible. `NotificationsScreen.tsx` affiche `registerError` comme un
  avertissement non bloquant (pas un rôle "alert" : le journal in-app reste normalement
  consultable en cas d'échec).
- **2 trous comblés** : `TC-021-02` (parité mobile — notification `rappel_creneau` affichée avec
  son libellé, nouvelle fixture `NOTIF_RAPPEL` ajoutée côté mobile) et `TC-021-04` (permission push
  refusée — aucun enregistrement tenté, aucune erreur affichée, permission simulée via
  `expo-notifications` mocké pour cette assertion précise).
- Ré-exécution complète : mobile 133/133 verts, web 129/129 verts (inchangé, vérifié par
  précaution), `tsc --noEmit` propre des deux côtés — aucune régression.
- **US-21 / RF-020 est maintenant intégralement couvert et conforme, sans trou de couverture ni
  bug ouvert.** Avec cette session, **le module Notifications (US-20/US-21) est entièrement clos
  en QA.**

### Session du 2 septembre 2026 (US-22 / RF-021 — annulation et remboursement)
- Périmètre testé : US-22 (Sprint 8, extension du module Réservation) — le mécanisme d'annulation
  (`useAnnulerReservation`, `annulerReservation`, `estReservationAnnulable`), déjà partiellement
  exercé dans les sessions US-18/19 (câblé dans `HistoriqueList`/`HistoriqueScreen`) mais jamais
  vérifié pour lui-même en tant que story dédiée.
- **Choix de conception confirmé par lecture du code** (documenté dans `types.ts:43-47` et
  `backlog.md`) : "la politique de délai définie" du RF-021 n'a aucune valeur en dur côté frontend
  — c'est une règle métier backend. Le frontend ne vérifie lui-même qu'une seule condition
  (`estReservationAnnulable` : réservation confirmée ET créneau pas encore commencé) et relaie tel
  quel ce que le backend répond (`rembourse`/`message`). Cohérent avec le principe déjà appliqué
  pour les opérateurs de paiement (US-12/13/14) : le frontend ne simule jamais une règle métier
  qu'il ne connaît pas réellement.
- **Observation signalée, pas un bug** : `useAnnulerReservation` gère un cas "non connecté"
  (`if (!token) { setAnnulerError(...); return null; }`) qui est en pratique **inatteignable
  depuis l'UI actuelle** — `HistoriqueList`/`HistoriqueScreen` affichent déjà l'écran "invite à se
  connecter" avant même de rendre un seul bouton d'annulation dès lors que `token` est `null`. Même
  nature que le code mort déjà signalé pour US-08 — pas un défaut fonctionnel, juste du code
  défensif qui ne peut actuellement pas s'exécuter par ce chemin.
- 8 cas de test — 3 ✅ passés, 0 ❌ échoué, 1 ⏸️ non exécutable, **4 ◻️ non couverts**.
- **4 trous de couverture identifiés** :
  1. L'échec de l'annulation côté backend (`ok: false`) n'est testé sur aucune des deux
     plateformes — aucune vérification que `annulerError` s'affiche et que la réservation reste
     inchangée (bouton toujours disponible pour réessayer).
  2. La désactivation du bouton pendant l'appel (`annulingId === reservation.id`, texte
     "Annulation en cours…") n'est jamais vérifiée.
  3. Une réservation **non confirmée** (ex. `en_attente_paiement`) avec un créneau futur n'est
     jamais utilisée en fixture — `estReservationAnnulable` exige `statut === 'confirmee'` en plus
     du créneau futur, mais seule la moitié droite du ET logique (créneau futur/passé) est
     réellement isolée par un test ; l'autre moitié (statut confirmé ou non) ne l'est pas.
  4. **Le cas `rembourse: false` n'est jamais testé** — le seul scénario de succès exercé jusqu'ici
     a un remboursement systématique (`rembourse: true`). RF-021 dit pourtant explicitement
     "déclencher le remboursement... **si** l'annulation respecte ce délai" : le cas où elle ne le
     respecte pas (annulation actée, message affiché, mais sans remboursement) est au cœur même de
     l'exigence et n'a jamais été vérifié.
- **1 cas ⏸️ non exécutable** : la politique de délai elle-même (ex. "24h avant le créneau") est une
  règle métier backend qui n'existe nulle part dans ce dépôt — rien à observer côté frontend seul.
- Suite exécutée pour de vrai : web `npx vitest run HistoriqueList` → 11/11 verts ; mobile
  `npx jest HistoriqueScreen` → 11/11 verts.
- **US-22 / RF-021 n'est pas encore intégralement clos** : 4 trous à combler.

### Session du 2 septembre 2026 (comblement des 4 trous US-22)
- **4 trous comblés** : `TC-022-04` (échec de l'annulation côté backend, web et mobile),
  `TC-022-05` (désactivation du bouton pendant l'appel, web et mobile), `TC-022-06` (réservation
  non confirmée à créneau futur — nouvelle fixture `RESERVATION_EN_ATTENTE` ajoutée aux deux
  plateformes, isole enfin la moitié gauche du ET logique de `estReservationAnnulable`),
  `TC-022-07` (`rembourse: false` — le cas central de "si l'annulation respecte ce délai" côté
  RF-021, jamais exercé jusqu'ici).
- Ré-exécution complète : web 133/133 verts, mobile 137/137 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-22 / RF-021 est maintenant intégralement couvert et conforme, sans bug ouvert.** Seul
  TC-022-08 (politique de délai elle-même) reste ⏸️ non exécutable, par nature dépendant d'un
  backend absent de ce dépôt.

### Session du 2 septembre 2026 (US-23 / RF-022 — filtres de recherche avancés)
- Périmètre testé : US-23 (Sprints 15/16, extension du module Recherche & Catalogue) —
  `prixMax`/`distanceMaxKm`/`equipements` dans `SearchTerrains`/`SearchTerrainsScreen`, déjà
  partiellement exercés au fil des sessions US-07/US-09 (fichier partagé) mais jamais évalués pour
  eux-mêmes en tant que story dédiée.
- **Constat en ouvrant la session** : contrairement à d'autres stories tardives du backlog, ce
  fichier avait déjà reçu une couverture substantielle pour US-23 lors de son développement initial
  — `it.each`/tests dédiés pour prix+équipements combinés, activation/désactivation du filtre
  distance selon la position, affichage des équipements dans les résultats, sur les deux
  plateformes. Peu de trous réels à trouver, contrairement aux sessions précédentes.
- 4 cas de test — 3 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, **1 ◻️ non couvert**.
- **1 trou de couverture identifié** : `toggleEquipement` (`useRechercheTerrains.ts:73-75`) a deux
  branches symétriques (`prev.filter(...)` pour désélectionner, `[...prev, equipement]` pour
  sélectionner) — seule la branche "sélectionner" est exercée par les tests existants (cocher
  vestiaires et éclairage). Aucun test ne décoche un équipement déjà sélectionné pour vérifier
  qu'il disparaît bien de la sélection et de la requête envoyée.
- Suite exécutée pour de vrai : web `npx vitest run SearchTerrains` → 13/13 verts ; mobile
  `npx jest SearchTerrainsScreen` → 14/14 verts.
- **US-23 / RF-022 n'est pas encore intégralement clos** : 1 trou à combler.

### Session du 2 septembre 2026 (comblement du trou US-23)
- **1 trou comblé** : `TC-023-04` (désélection d'un équipement — branche `prev.filter(...)` de
  `toggleEquipement`, web et mobile).
- Ré-exécution complète : web 134/134 verts, mobile 138/138 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-23 / RF-022 est maintenant intégralement couvert et conforme, sans bug ouvert.**

### Session du 2 septembre 2026 (US-24 / RF-023 — messagerie in-app)
- Périmètre testé : US-24 (premier **Could have** testé), module Messagerie —
  `MessagerieView`/`MessagerieScreen`, déjà partiellement exercé dans les sessions US-18/19 (lien
  "Envoyer un message" depuis l'historique) mais jamais évalué pour lui-même.
- **Hypothèse de portée confirmée par lecture du code** (documentée dans `backlog.md` et
  `MessagerieView.tsx:14-18`) : une conversation existe dès qu'une réservation est initiée
  (`en_attente_paiement` inclus), pas seulement une fois confirmée — cohérent avec "poser une
  question... avant de réserver" de la user story. Rien à tester côté frontend pour ce point : la
  vue ne fait aucune distinction de statut, elle affiche la conversation pour n'importe quel
  `reservationId` reçu.
- Aucune nouvelle occurrence de BUG-002 : `token` correctement initialisé à `undefined` des deux
  côtés.
- 8 cas de test — 4 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, **4 ◻️ non couverts**.
- **4 trous de couverture identifiés** :
  1. L'échec du chargement de la conversation (`ok: false`) n'est testé sur aucune des deux
     plateformes — même trou récurrent déjà rencontré pour l'historique, les reversements et les
     notifications.
  2. L'échec de l'envoi d'un message (`ok: false`) n'est jamais testé — ni `sendError`, ni le fait
     que le message ne doit pas apparaître dans la conversation s'il n'a pas été créé côté backend.
  3. Le vidage immédiat du champ de saisie **avant** la résolution de l'envoi est un choix
     explicitement commenté dans le code des deux plateformes ("UX de messagerie classique") mais
     jamais verrouillé par un test — même situation que le commentaire `commentaire.trim() ||
     undefined` de US-16 (TC-016-06) avant qu'il ne soit testé.
  4. La désactivation du bouton "Envoyer" pendant l'envoi (`disabled={sending || !texte.trim()}`,
     texte "Envoi…") n'est jamais vérifiée — même pattern déjà comblé pour US-16/US-22.
- Suite exécutée pour de vrai : web `npx vitest run MessagerieView` → 4/4 verts ; mobile
  `npx jest MessagerieScreen` → 4/4 verts.
- **US-24 / RF-023 n'est pas encore intégralement clos** : 4 trous à combler.

### Session du 2 septembre 2026 (comblement des 4 trous US-24)
- **4 trous comblés** : `TC-024-05` (échec du chargement, web et mobile), `TC-024-06` (échec de
  l'envoi, web et mobile), `TC-024-07` (vidage immédiat du champ, comportement volontaire désormais
  verrouillé par un test), `TC-024-08` (désactivation du bouton "Envoyer" pendant l'appel).
- Ré-exécution complète : web 138/138 verts, mobile 142/142 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-24 / RF-023 est maintenant intégralement couvert et conforme, sans bug ouvert.**

### Session du 2 septembre 2026 (US-25 / RF-024 — recommandations personnalisées)
- Périmètre testé : US-25 (deuxième Could have), module Recommandations —
  `RecommandationsList`/`RecommandationsScreen`, jamais évalué jusqu'ici.
- **Différence structurelle notée par rapport à la recherche (US-07)** : `fetchRecommandations`
  exige un token (contrairement à `searchTerrains`, public) — cohérent avec RF-024, une
  recommandation dépend de l'historique personnel du joueur connecté. Confirmé par lecture du code
  (`recommandationApi.ts`) et déjà exercé par le test "invite à se connecter..." existant.
- Aucune nouvelle occurrence de BUG-002 : `token` correctement initialisé à `undefined` des deux
  côtés.
- 5 cas de test — 3 ✅ passés, 0 ❌ échoué, 1 ⏸️ non exécutable, **1 ◻️ non couvert**.
- **1 trou de couverture identifié** : l'échec du chargement des recommandations (`ok: false`)
  n'est testé sur aucune des deux plateformes — même trou récurrent déjà rencontré pour
  l'historique, les reversements, les notifications et la messagerie.
- **1 cas ⏸️ non exécutable** : l'algorithme de suggestion lui-même (quels terrains sont recommandés
  et sur quels critères d'historique) est une décision métier backend, explicitement documentée
  comme telle dans le code (`recommandationApi.ts` : "l'algorithme de suggestion... reste une
  décision backend") — rien à observer côté frontend seul, qui ne fait qu'afficher ce que
  `/api/recommandations/terrains` renvoie.
- Suite exécutée pour de vrai : web `npx vitest run RecommandationsList` → 3/3 verts ; mobile
  `npx jest RecommandationsScreen` → 3/3 verts.
- **US-25 / RF-024 n'est pas encore intégralement clos** : 1 trou à combler.

### Session du 2 septembre 2026 (comblement du trou US-25)
- **1 trou comblé** : `TC-025-04` (échec du chargement des recommandations, web et mobile).
- Ré-exécution complète : web 139/139 verts, mobile 143/143 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-25 / RF-024 est maintenant intégralement couvert et conforme, sans bug ouvert.** Seul
  TC-025-05 (algorithme de suggestion) reste ⏸️ non exécutable, par nature dépendant d'un backend
  absent de ce dépôt.

### Session du 2 septembre 2026 (US-26 / RF-025 — programme de parrainage)
- Périmètre testé : US-26 (dernière story du backlog, troisième et dernier Could have), module
  Parrainage — `ParrainageView`/`ParrainageScreen`, jamais évalué jusqu'ici.
- Aucune nouvelle occurrence de BUG-002 : `token` correctement initialisé à `undefined` des deux
  côtés.
- 11 cas de test — 6 ✅ passés, 0 ❌ échoué, 1 ⏸️ non exécutable, **5 ◻️ non couverts**.
- **Trou de parité mobile identifié en comparant les deux fichiers de test** : web a 5 tests
  (dont "affiche une erreur si le code de parrainage est invalide"), mobile n'en a que 4 — le cas
  "code invalide" n'a pas d'équivalent mobile.
- **4 autres trous de couverture identifiés (web et mobile)** :
  1. L'échec du chargement du résumé de parrainage (`ok: false`) n'est testé sur aucune des deux
     plateformes — même trou récurrent déjà rencontré à cinq reprises dans ce module Should/Could
     have.
  2. Le vidage du champ **une fois le code accepté avec succès** est un choix documenté en
     commentaire ("contrairement à l'envoi d'un message (US-24), un code refusé doit rester
     visible") — seule la moitié "pas vidé en cas d'échec" est verrouillée par un test existant, pas
     la moitié "vidé en cas de succès".
  3. La désactivation du bouton "Utiliser" pendant l'envoi n'est jamais vérifiée — même pattern
     déjà comblé pour US-16/US-22/US-24.
  4. Un filleul au statut `en_attente` (avantage pas encore accordé, `avantage: null`) n'est jamais
     utilisé en fixture — seul le statut `valide` avec un avantage déjà accordé est testé.
- **1 cas ⏸️ non exécutable** : la génération du code de parrainage et la définition précise de
  l'avantage accordé sont des décisions métier backend, explicitement documentées comme telles
  (`backlog.md`) — rien à observer côté frontend seul.
- Suite exécutée pour de vrai : web `npx vitest run ParrainageView` → 5/5 verts ; mobile
  `npx jest ParrainageScreen` → 4/4 verts.
- **US-26 / RF-025 n'est pas encore intégralement clos** : 5 trous à combler. Avec cette session,
  **les 26 user stories du backlog ont maintenant chacune reçu au moins une session QA dédiée.**

### Session du 2 septembre 2026 (comblement des 5 trous US-26)
- **5 trous comblés** : `TC-026-05` (parité mobile — code invalide), `TC-026-07` (échec du
  chargement, web et mobile), `TC-026-08` (vidage du champ après un succès, web et mobile),
  `TC-026-09` (désactivation du bouton "Utiliser" pendant l'appel, web et mobile), `TC-026-10`
  (filleul au statut `en_attente`, web et mobile).
- Ré-exécution complète : web 143/143 verts, mobile 148/148 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **US-26 / RF-025 est maintenant intégralement couvert et conforme, sans bug ouvert.** Seul
  TC-026-11 (génération du code/avantage) reste ⏸️ non exécutable, par nature dépendant d'un
  backend absent de ce dépôt.
- **Avec cette session, les 26 user stories du backlog sont toutes intégralement closes en QA**
  (0 ❌ échoué, 0 ◻️ non couvert restant sur l'ensemble du périmètre testé) — à l'exception des cas
  ⏸️ non exécutables intrinsèquement dépendants d'un backend Laravel qui n'existe pas encore dans
  ce dépôt, et du caveat Wave/Orange Money/Moov Money noté le 1 septembre 2026, qui restent tous
  deux des limitations connues et documentées plutôt que des trous à combler ici.

---

Périmètre : US-18 (Sprint 8) — historique des réservations, rôle **joueur** uniquement (RF-018).
Code vérifié : `packages/historique-core/src/{historiqueApi,useHistorique}.ts`,
`web/src/modules/historique/components/HistoriqueList.tsx`,
`mobile/src/modules/historique/screens/HistoriqueScreen.tsx`.

> **Note de périmètre** : `HistoriqueList`/`HistoriqueScreen` sont un fichier partagé avec US-19
> (rôle `proprietaire`, RF-019), US-22 (annulation, RF-021) et US-24 (messagerie, RF-023), et
> embarquent aussi le lien vers US-16 (notation, RF-016). Ce fichier ne couvre volontairement que
> les cas propres à RF-018 (rôle joueur, consultation) — les autres seront vérifiés dans leurs
> sessions dédiées, à l'exception de US-19 qui, contrairement aux cas "satisfait par construction"
> vus jusqu'ici (US-13/14, RF-005), **nécessitera une vérification réelle séparée** : le composant
> branche effectivement sur `role` (endpoint, titre, et le bouton d'annulation réservé au joueur).

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-018-01 | RF-018 | Joueur connecté (web et mobile) | 1. Ouvrir l'écran historique | Appel `GET /api/reservations/mes-reservations` ; titre "Mes réservations" affiché | `it.each` "charge le bon endpoint et affiche le bon titre..." (cas `role: 'joueur'`) : bon endpoint appelé, bon titre affiché | ✅ Passé |
| TC-018-02 | RF-018 | Le joueur a une réservation à venir et une réservation passée (web et mobile) | 1. Ouvrir l'écran historique | Les deux réservations s'affichent ensemble, sans filtrage passé/à venir imposé par RF-018 | Démontré indirectement par le test "Envoyer un message..." : les 2 réservations (`RESERVATION_A_VENIR` + `RESERVATION_PASSEE`) sont bien rendues simultanément (2 liens trouvés, un par réservation) | ✅ Passé |
| TC-018-03 | RF-018 | Le joueur n'a encore aucune réservation (web et mobile) | 1. Ouvrir l'écran historique | Message clair "Aucune réservation" affiché plutôt qu'une liste vide silencieuse | Test "affiche un message clair quand il n'y a encore aucune réservation" : message affiché | ✅ Passé |
| TC-018-04 | RF-018 | Visiteur non connecté (web et mobile) | 1. Ouvrir l'écran historique | Message invitant à se connecter affiché plutôt qu'une liste vide ou une erreur générique | Test "invite à se connecter si l'utilisateur n'a pas de session" : message affiché (`role="alert"` web) | ✅ Passé |
| TC-018-05 | RF-018 | Joueur connecté, `GET /api/reservations/mes-reservations` répond `ok: false` (web et mobile) | 1. Ouvrir l'écran historique 2. L'API échoue | Message d'erreur affiché (`error && reservations.length === 0` → "Impossible de charger ton historique. Réessaie plus tard.") | Test "affiche une erreur si le chargement de l'historique échoue" ajouté (`HistoriqueList.test.tsx`/`HistoriqueScreen.test.tsx`) : message affiché | ✅ Passé *(re-testé le 2 septembre 2026)* |

**Résumé US-18** *(à jour après comblement du trou)* : 5 cas — 5 ✅ passés, 0 ❌ échoué,
0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé.** Ré-exécution complète : web 126/126 verts, mobile 126/126 verts,
`tsc --noEmit` propre des deux côtés. **US-18 / RF-018 est intégralement couvert.**

---

Périmètre : US-19 (Sprint 8) — historique des réservations, rôle **propriétaire/gestionnaire**
uniquement (RF-019). Code vérifié : même fichier que US-18 —
`packages/historique-core/src/{historiqueApi,useHistorique}.ts`,
`web/src/modules/historique/components/HistoriqueList.tsx`,
`mobile/src/modules/historique/screens/HistoriqueScreen.tsx`.

> **Note de périmètre** : voir la note de périmètre de US-18 — même fichier partagé, US-22/US-24
> hors périmètre ici. **US-19 ne se limite pas au "satisfait par construction"** : le composant
> branche réellement sur `role` (voir la session ci-dessus pour le détail des points vérifiés
> spécifiquement pour ce rôle).

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-019-01 | RF-019 | Propriétaire/gestionnaire connecté (web et mobile) | 1. Ouvrir l'écran historique | Appel `GET /api/reservations/recues` ; titre "Réservations reçues" affiché | `it.each` "charge le bon endpoint et affiche le bon titre..." (cas `role: 'proprietaire'`) : bon endpoint appelé, bon titre affiché | ✅ Passé |
| TC-019-02 | RF-019 | Le propriétaire a reçu au moins une réservation, avec un joueur, un créneau et un montant définis (web et mobile) | 1. Ouvrir l'écran historique | RF-019 : "voir qui a réservé... et quand... afin de suivre son activité **et ses revenus**" — le nom du joueur (étiqueté "Joueur :"), la date du créneau et le montant doivent être visibles | Test "affiche qui a réservé (étiquette + nom), quand (créneau) et le montant..." ajouté (`HistoriqueList.test.tsx`/`HistoriqueScreen.test.tsx`) : "Joueur : Awa Diallo", le début du créneau et "15000" sont bien tous les trois rendus | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-019-03 | RF-019, RF-021 | Réservation confirmée et à venir, rôle propriétaire (web et mobile) | 1. Ouvrir l'écran historique | Aucun bouton "Annuler ma réservation" ne doit apparaître côté propriétaire (RF-021 réserve l'annulation au joueur) | Test "ne propose pas l'annulation côté propriétaire..." : bouton absent | ✅ Passé |
| TC-019-04 | RF-019 | Le propriétaire n'a reçu aucune réservation (web et mobile) | 1. Ouvrir l'écran historique | Message clair "Aucune réservation" affiché | Code lu : la branche `reservations.length === 0` (`HistoriqueList.tsx:70`/`HistoriqueScreen.tsx:81`) ne référence `role` nulle part — comportement identique au cas déjà testé pour `role="joueur"` (TC-018-03) | ✅ Passé *(satisfait par construction — zéro branchement sur `role` dans ce chemin, vérifié par lecture du code)* |
| TC-019-05 | RF-019 | Visiteur non connecté consultant la vue propriétaire (web et mobile) | 1. Ouvrir l'écran historique | Message invitant à se connecter affiché | Code lu : la gate `token === undefined` intervient avant tout usage de `role` — comportement identique au cas déjà testé pour `role="joueur"` (TC-018-04) | ✅ Passé *(satisfait par construction, idem)* |
| TC-019-06 | RF-019 | Propriétaire connecté, `GET /api/reservations/recues` répond `ok: false` (web et mobile) | 1. Ouvrir l'écran historique 2. L'API échoue | Message d'erreur affiché | Code lu : la branche `error && reservations.length === 0` ne référence `role` nulle part — comportement identique au cas déjà testé et comblé pour `role="joueur"` (TC-018-05) | ✅ Passé *(satisfait par construction, idem)* |

**Résumé US-19** *(à jour après comblement du trou)* : 6 cas — 6 ✅ passés, 0 ❌ échoué,
0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé.** Ré-exécution complète : web 127/127 verts, mobile 127/127 verts,
`tsc --noEmit` propre des deux côtés. **US-19 / RF-019 est intégralement couvert. Avec cette
session, le module Historique (US-18/US-19) est entièrement clos en QA.**

---

Périmètre : US-20 (Sprint 8) — notifications, volet **confirmation d'une réservation** uniquement
(RF-020). Code vérifié : `packages/notification-core/src/{useNotifications,notificationApi,types}.ts`,
`web/src/modules/notifications/components/NotificationsList.tsx`,
`mobile/src/modules/notifications/screens/NotificationsScreen.tsx`.

> **Note de périmètre** : ce même mécanisme (`useNotifications`) sert aussi US-21 (volet "rappel
> de créneau" de RF-020, `type: 'rappel_creneau'`) et embarque côté mobile
> `usePushRegistration` (enregistrement du jeton push, attribué à US-21 dans `backlog.md`) — les
> deux hors périmètre ici, à vérifier dans une session US-21 dédiée.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-020-01 | RF-020 | Utilisateur connecté avec une notification de confirmation de réservation (web et mobile) | 1. Ouvrir l'écran notifications | Le libellé "Réservation confirmée" et le message associé s'affichent | Test "affiche les notifications de confirmation et de rappel" (web) / "affiche les notifications reçues" (mobile) : libellé affiché | ✅ Passé |
| TC-020-02 | RF-020 | Notification de confirmation non lue affichée (web et mobile) | 1. Cliquer/toucher "Marquer comme lue" | Le bouton disparaît (mise à jour optimiste locale), `PATCH /api/notifications/:id/lue` appelé | Test "marque une notification comme lue" : bouton absent après l'action | ✅ Passé |
| TC-020-03 | RF-020 | Aucune notification (web et mobile) | 1. Ouvrir l'écran notifications | Message clair "Aucune notification" affiché | Test "affiche un message clair quand il n'y a encore aucune notification" : message affiché | ✅ Passé |
| TC-020-04 | RF-020 | Visiteur non connecté, **web** | 1. Ouvrir l'écran notifications | Message invitant à se connecter affiché | Test "invite à se connecter si l'utilisateur n'a pas de session" : message affiché (`role="alert"`) | ✅ Passé |
| TC-020-05 | RF-020 | Utilisateur connecté, `GET /api/notifications` répond `ok: false` (web et mobile) | 1. Ouvrir l'écran notifications 2. L'API échoue | Message d'erreur affiché (`error && notifications.length === 0`) | Test "affiche une erreur si le chargement des notifications échoue" ajouté (`NotificationsList.test.tsx`/`NotificationsScreen.test.tsx`) : message affiché | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-020-06 | RF-020 | Notification non lue, `PATCH /api/notifications/:id/lue` répond `ok: false` (web et mobile) | 1. Cliquer/toucher "Marquer comme lue" 2. L'API refuse | Comportement volontaire (`useNotifications.ts:70-72`) : aucune erreur affichée, la notification reste visible comme non lue (le bouton "Marquer comme lue" reste présent) | Test "laisse la notification affichée comme non lue si le marquage échoue..." ajouté : bouton toujours présent, aucune alerte affichée | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-020-07 | RF-020 | Visiteur non connecté, **parité mobile de TC-020-04** | 1. Ouvrir l'écran notifications | Message invitant à se connecter affiché (même comportement que le web) | Test "invite à se connecter si l'utilisateur n'a pas de session" ajouté à `NotificationsScreen.test.tsx` : message affiché | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-020-08 | RF-020 | Une réservation vient d'être confirmée (webhook de paiement validé) | 1. Observer les destinataires de la notification générée côté backend | RF-020 : la confirmation doit notifier "le joueur **et** le propriétaire/gestionnaire" | **Re-testé le 9 septembre 2026, backend implémenté** (`CreerNotificationsConfirmation`, module Notifications) : test Pest "notifie le joueur et le propriétaire quand le paiement est validé" (`WebhookPaiementTest.php`) — deux lignes NOTIFICATION créées, une par destinataire | ✅ Passé *(re-testé le 9 septembre 2026, backend)* |
| TC-020-09 | RF-020 | Une réservation vient d'être confirmée | 1. Observer le déclenchement effectif de la création de la notification | RF-020 : l'envoi doit se déclencher "à la confirmation d'une réservation" | **Re-testé le 9 septembre 2026** : `TraiterWebhookPaiement` déclenche bien `CreerNotificationsConfirmation` dès que le webhook signale un paiement validé (même test que TC-020-08). **Limite qui subsiste** : seule la ligne NOTIFICATION en base est créée — la délivrance effective (push FCM, SMS, email) n'est pas branchée à un service tiers réel (aucun accès dans cet environnement, documenté dans `notification-core`/`backlog.md`) | ⏸️ Non exécutable (délivrance push/SMS/email réelle — aucun service tiers accessible ; la création de la notification, elle, est désormais ✅ vérifiée, voir TC-020-08) |

**Résumé US-20** *(à jour après vérification backend du 9 septembre 2026)* : 9 cas — 8 ✅ passés,
0 ❌ échoué, 1 ⏸️ non exécutable (TC-020-09, délivrance push/SMS/email réelle uniquement —
aucun service tiers accessible dans cet environnement), 0 ◻️ non couvert.

**Aucun bug trouvé.** Ré-exécution complète (9 septembre 2026) : backend 187/187 Pest verts (433
assertions), web 143/143 verts, mobile 148/148 verts, `tsc --noEmit` propre des deux côtés.
**US-20 / RF-020 (volet confirmation) est intégralement couvert**, sous réserve du seul cas non
exécutable restant (délivrance réelle hors de l'application).

---

Périmètre : US-21 (Sprint 8/14) — volet **rappel de créneau** de RF-020 et enregistrement du jeton
push (mobile uniquement). Code vérifié :
`packages/notification-core/src/{useEnregistrerPushToken,notificationApi}.ts`,
`mobile/src/modules/notifications/hooks/usePushRegistration.ts`,
`web/src/modules/notifications/components/NotificationsList.tsx` (affichage du type seulement),
`mobile/src/modules/notifications/screens/NotificationsScreen.tsx`.

> **Note de périmètre** : le mécanisme d'affichage (`useNotifications`, marquage lu, chargement)
> est identique à US-20, déjà entièrement vérifié dans sa session dédiée — non retesté ici. Le
> web n'a aucune spécificité US-21 propre (pas de web push dans l'architecture) au-delà de
> l'affichage du libellé "Rappel de créneau", déjà exercé côté web dans le test partagé de US-20.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-021-01 | RF-020 | Utilisateur connecté avec une notification de rappel de créneau, **web** | 1. Ouvrir l'écran notifications | Le libellé "Rappel de créneau" et le message associé s'affichent | Test "affiche les notifications de confirmation et de rappel" (`NotificationsList.test.tsx`, US-20) : libellé et message ("1 heure") affichés | ✅ Passé |
| TC-021-02 | RF-020 | Idem, **parité mobile** | 1. Ouvrir l'écran notifications | Même comportement que le web | Test "affiche une notification de rappel de créneau avec son libellé..." ajouté : libellé et message affichés | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-021-03 | RF-020 | Utilisateur connecté, mobile, permission de notification accordée | 1. Ouvrir l'écran notifications | Le jeton push est obtenu (`getExpoPushTokenAsync`) et enregistré (`POST /api/utilisateurs/moi/push-tokens`) | Test "enregistre le jeton push une fois la permission accordée" : `fetch` appelé avec le bon corps | ✅ Passé |
| TC-021-04 | RF-020 | Utilisateur connecté, mobile, permission de notification **refusée** | 1. Ouvrir l'écran notifications 2. Refuser la demande de permission système | Aucun jeton demandé/enregistré ; aucune erreur affichée (`usePushRegistration.ts:50-53` : "ce n'est pas une erreur applicative") | Test "ne tente aucun enregistrement et n'affiche aucune erreur si la permission push est refusée" ajouté : aucun appel `/push-tokens`, aucun message d'avertissement | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-021-05 | RF-020 | Un créneau confirmé approche de son horaire (dans la fenêtre configurée) | 1. Exécuter la tâche planifiée `notifications:rappels-creneaux` | RF-020 : "rappeler au joueur son créneau à l'approche de l'horaire réservé" | **Re-testé le 9 septembre 2026, backend implémenté** (`EnvoyerRappelsCreneaux`, `Schedule::command(...)->everyFifteenMinutes()` dans `routes/console.php`) : test Pest "crée un rappel pour une réservation confirmée dont le créneau approche" — notification créée pour le joueur uniquement (pas le propriétaire, conforme au texte de RF-020) ; tests complémentaires "ne rappelle pas un créneau trop lointain" et "ne crée pas deux fois le même rappel" (idempotence si la tâche tourne plusieurs fois avant l'échéance) | ✅ Passé *(re-testé le 9 septembre 2026, backend)* |
| TC-021-06 | RF-020 | Utilisateur connecté, mobile, `POST /api/utilisateurs/moi/push-tokens` répond `ok: false` | 1. Ouvrir l'écran notifications 2. L'enregistrement du jeton échoue | **Corrigé** (voir BUG-007) : un avertissement non bloquant s'affiche ("Impossible d'activer les notifications push sur cet appareil : ..."), le journal in-app reste normalement consultable | Test "affiche un avertissement si l'enregistrement du jeton push échoue" ajouté : avertissement affiché, notification toujours listée | ✅ Passé |
| TC-021-07 | RF-020 | Utilisateur connecté, mobile, jeton push valide | 1. `POST /api/utilisateurs/moi/push-tokens` avec un jeton déjà connu | Le jeton n'est pas dupliqué dans `UTILISATEUR.push_tokens` (un même appareil peut redemander la permission plusieurs fois) | **Ajouté le 9 septembre 2026, backend** : test Pest "n'ajoute pas deux fois le même jeton" (`PushTokenTest.php`) — tableau inchangé après un second enregistrement du même jeton | ✅ Passé *(nouveau, backend)* |

**Résumé US-21** *(à jour après vérification backend du 9 septembre 2026)* : 7 cas —
7 ✅ passés, 0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert. **Le délai de rappel par défaut
(2h, `config('notification.delai_rappel_heures')`) reste une valeur technique provisoire signalée
comme telle dans le code — RF-020 ne chiffre aucun délai, pas une omission de ce module.**

### Bugs — US-21

| ID bug | Cas de test | Exigence SRS | Gravité | Description | Attendu (SRS) | Observé | Statut |
|--------|--------------|----------------|----------|----------------|------------------|------------|--------|
| BUG-007 | TC-021-06 | RF-020 | Mineur | `NotificationsScreen.tsx` appelait `usePushRegistration(...)` sans jamais utiliser sa valeur de retour — `registerError` ne pouvait donc jamais atteindre l'utilisateur, quel que soit le résultat de l'enregistrement du jeton push | Un échec du seul canal permettant à un rappel (US-21) d'atteindre l'utilisateur hors de l'application ne doit pas rester silencieux indéfiniment | **Corrigé le 2 septembre 2026** : `registerError` est désormais affiché comme un avertissement non bloquant (pas un rôle "alert" — le journal in-app reste normalement consultable, ce n'est pas une erreur qui empêche l'écran de fonctionner). Re-vérifié par un test permanent ajouté | ✅ Corrigé |

**Note sur BUG-007** : gravité "Mineur" plutôt que "Majeur" — contrairement à BUG-006 (paiement),
ce n'est pas un cul-de-sac total : l'effet de `usePushRegistration` se redéclenche à chaque
remontage de l'écran, donc un échec transitoire se corrige tout seul à la prochaine visite. Le
signalement initial n'était pas un ❌ formel (le SRS ne spécifie rien sur la remontée d'erreur de
ce mécanisme d'infrastructure) mais une observation soumise à arbitrage — **arbitrage (2 septembre
2026, utilisateur) : correction demandée**, plutôt que le compromis "laisser tel quel" choisi pour
l'ambiguïté analogue de US-17.

---

Périmètre : US-22 (Sprint 8) — annulation et remboursement d'une réservation, extension du module
Réservation (RF-021). Code vérifié : `packages/reservation-core/src/{useAnnulerReservation,
reservationApi,types}.ts`, `packages/historique-core/src/useHistorique.ts`
(`estReservationAnnulable`), câblé dans `web/src/modules/historique/components/HistoriqueList.tsx`
et `mobile/src/modules/historique/screens/HistoriqueScreen.tsx` (déjà vérifiés pour leurs propres
stories, US-18/19).

> **Note de périmètre** : l'affichage de l'historique lui-même (endpoint, titre, rôle) est hors
> périmètre ici — déjà entièrement couvert par US-18/US-19. Seul le mécanisme d'annulation propre
> à RF-021 est évalué dans cette session.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-022-01 | RF-021 | Joueur connecté, réservation confirmée dont le créneau n'a pas encore commencé (web et mobile) | 1. Ouvrir l'historique | Le bouton "Annuler ma réservation" est visible pour cette réservation uniquement (pas pour une réservation confirmée mais déjà passée) | Test "propose \"Annuler ma réservation\" uniquement côté joueur pour une réservation confirmée à venir" : 1 seul bouton trouvé (sur 2 réservations, une à venir + une passée, toutes deux confirmées) | ✅ Passé |
| TC-022-02 | RF-021 | Réservation confirmée à venir, rôle propriétaire (web et mobile) | 1. Ouvrir l'historique | Aucun bouton d'annulation ne doit apparaître côté propriétaire | Test "ne propose pas l'annulation côté propriétaire..." : bouton absent | ✅ Passé |
| TC-022-03 | RF-021 | Réservation annulable, l'annulation respecte le délai (web et mobile) | 1. Cliquer/toucher "Annuler ma réservation" 2. Le backend répond `rembourse: true` | Le message du backend s'affiche tel quel, le statut passe à "Annulée" localement (sans re-fetch), le bouton disparaît | Test "annule une réservation et affiche le message renvoyé par le backend..." : message affiché, statut "annulée" affiché, bouton disparu | ✅ Passé |
| TC-022-04 | RF-021 | Réservation annulable, `POST /api/reservations/:id/annulation` répond `ok: false` (web et mobile) | 1. Cliquer/toucher "Annuler ma réservation" 2. L'API refuse | `annulerError` affiché, la réservation reste inchangée (bouton toujours disponible pour réessayer) | Test "affiche une erreur et laisse la réservation inchangée si l'annulation échoue" ajouté : message affiché, statut toujours "Confirmée", bouton toujours présent | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-022-05 | RF-021 | Clic/appui sur "Annuler ma réservation" pendant que l'appel est déjà en cours (web et mobile) | 1. Cliquer/toucher "Annuler ma réservation" 2. Observer le bouton avant la résolution de l'appel | Le bouton est désactivé et affiche "Annulation en cours…" (`disabled={annulingId === reservation.id}`) | Test "désactive le bouton \"Annuler ma réservation\"..." ajouté : bouton désactivé, texte "Annulation en cours…" affiché, confirmation affichée une fois l'appel résolu | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-022-06 | RF-021 | Réservation **non confirmée** (ex. `en_attente_paiement`) avec un créneau futur, rôle joueur (web et mobile) | 1. Ouvrir l'historique | Aucun bouton d'annulation — `estReservationAnnulable` exige `statut === 'confirmee'` en plus du créneau futur | Test "ne propose pas l'annulation pour une réservation non confirmée..." ajouté (nouvelle fixture `RESERVATION_EN_ATTENTE`) : bouton absent | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-022-07 | RF-021 | Réservation annulable, l'annulation **ne respecte pas** le délai (web et mobile) | 1. Cliquer/toucher "Annuler ma réservation" 2. Le backend répond `rembourse: false` | RF-021 : le remboursement n'est déclenché que "si l'annulation respecte ce délai" — le message du backend doit s'afficher tel quel même sans remboursement, la réservation doit quand même passer à "Annulée" | Test "affiche le message du backend et annule la réservation même sans remboursement..." ajouté : message affiché, statut "annulée", bouton disparu | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-022-08 | RF-021 | Une réservation confirmée existe, proche ou loin de son créneau | 1. Observer à partir de quel moment précis l'annulation cesse d'ouvrir droit à un remboursement | RF-021 : "selon une politique de délai définie" | **Re-testé le 9 septembre 2026, backend implémenté — la règle a changé deux fois avant de se stabiliser** (voir `backlog.md`, US-22) : une première version backend appliquait un seuil unique de 24h ; **révisée le même jour** à la demande du porteur de projet, RF-021 est en fait une politique **entièrement configurable par chaque propriétaire, par terrain**, sous forme de paliers illimités (délai avant le créneau → % remboursé, entité PALIER_ANNULATION). `AnnulerReservation` retrouve le palier au délai le plus proche parmi ceux respectés — test Pest "applique le palier le plus proche parmi ceux respectés quand plusieurs sont définis" (`AnnulationTest.php`) | ✅ Passé *(re-testé le 9 septembre 2026, backend — politique révisée en paliers configurables)* |
| TC-022-09 | RF-021 | Un terrain n'a aucun palier respecté au délai d'annulation demandé | 1. Annuler très tard (délai plus court que le palier le plus strict configuré) | Aucune règle du terrain ne couvre ce cas → aucun remboursement, pas d'erreur | **Ajouté le 9 septembre 2026, backend** : test Pest "n'annonce aucun remboursement quand aucun palier n'est respecté" — `rembourse: false`, le paiement reste `valide` (reversé normalement au propriétaire) | ✅ Passé *(nouveau, backend)* |
| TC-022-10 | RF-021 (frais de transaction, décision explicite du porteur de projet) | Un remboursement est dû (palier > 0%) | 1. Annuler dans le délai d'un palier à 100% | Les frais de transaction du terrain (`TERRAIN.frais_annulation_pourcentage`) sont déduits du montant brut avant remboursement, quel que soit le palier appliqué | **Ajouté le 9 septembre 2026, backend** : test Pest "déduit les frais de transaction propres au terrain du montant remboursé" — montant net = brut × (1 − frais/100), vérifié à 10% sur un terrain custom | ✅ Passé *(nouveau, backend)* |
| TC-022-11 | RF-004/RF-005 (précondition ajoutée à la publication, RF-021) | Propriétaire publiant un nouveau terrain | 1. `POST /api/terrains` sans `paliers` ou avec un tableau vide | La publication est refusée (422) — décision explicite : un terrain ne peut plus être publié sans politique d'annulation configurée | **Ajouté le 9 septembre 2026, backend** : tests Pest "refuse de publier un terrain sans aucun palier d'annulation" et "...avec un tableau de paliers vide" (`TerrainTest.php`) | ✅ Passé *(nouveau, backend)* |
| TC-022-12 | RF-021 (barème dégressif, décision explicite du porteur de projet) | Propriétaire publiant un terrain sans taux de frais explicite | 1. `POST /api/terrains` sans `fraisAnnulationPourcentage` | Le taux par défaut est calculé selon le barème dégressif (nombre de terrains détenus par le propriétaire) et le propriétaire est **averti par notification** avant toute application réelle sur un remboursement | **Ajouté le 9 septembre 2026, backend** : tests Pest "calcule le taux de frais par défaut et avertit le propriétaire..." (1 terrain → 2%) et "un deuxième terrain du même propriétaire reçoit le taux par défaut suivant du barème" (2 terrains → 1,5%) — notification `frais_annulation_defaut_attribue` créée, jamais pour un taux saisi explicitement | ✅ Passé *(nouveau, backend)* |

**Résumé US-22** *(à jour après vérification backend du 9 septembre 2026)* : 12 cas — 12 ✅ passés,
0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé cette session (frontend).** Ré-exécution complète (9 septembre 2026) :
backend 187/187 Pest verts, web 133/133 verts, mobile 137/137 verts, `tsc --noEmit` propre des
deux côtés. **US-22 / RF-021 est intégralement couvert**, y compris la politique de délai et les
frais de transaction, désormais entièrement testés côté backend. **Écart de traçabilité à noter
(pas un bug)** : le comportement livré va au-delà du texte littéral de RF-021 ("une politique de
délai définie", singulier) — c'est une politique par terrain, décision explicite et documentée
du porteur de projet (`architecture.md`, correction du 9 septembre 2026), pas une dérive
silencieuse.

---

Périmètre : US-23 (Sprints 15/16) — filtres de recherche avancés, extension du module Recherche &
Catalogue (RF-022). Code vérifié : `packages/recherche-core/src/{useRechercheTerrains,
rechercheApi,types}.ts`, `web/src/modules/recherche/components/SearchTerrains.tsx`,
`mobile/src/modules/recherche/screens/SearchTerrainsScreen.tsx`.

> **Note de périmètre** : le reste de ce fichier partagé (sport/localisation/date/heure de US-07,
> tri par proximité de US-09) est hors périmètre ici — déjà entièrement couvert dans leurs sessions
> respectives. Seuls `prixMax`/`distanceMaxKm`/`equipements` (RF-022) sont évalués ici.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-023-01 | RF-022 | Prix max saisi et équipements cochés, web et mobile | 1. Saisir un prix max 2. Cocher des équipements 3. Rechercher | La requête envoyée contient `prixMax` et `equipements` (liste jointe) | Test "envoie le prix max et les équipements sélectionnés dans la requête (US-23 / RF-022)" : les deux paramètres présents dans l'URL appelée | ✅ Passé |
| TC-023-02 | RF-022 | Filtre distance, avec et sans position GPS connue (web et mobile) | 1. Observer le champ "Distance max" sans position 2. Activer le tri par proximité 3. Observer à nouveau | Désactivé et inutilisable sans position (RF-022 n'a de sens qu'avec une référence) ; activé et envoyé (`distanceMaxKm`) une fois la position acquise | Web : deux tests dédiés ("désactive..."/"active..."). Mobile : un test combiné ("désactive...puis l'active..."). Les deux confirment le comportement | ✅ Passé |
| TC-023-03 | RF-022 | Un résultat de recherche possède des équipements (web et mobile) | 1. Lancer une recherche | Les équipements du terrain (ex. "Vestiaires, Éclairage") s'affichent sur le résultat | Test "affiche les équipements du terrain quand le backend les renvoie" : libellés affichés | ✅ Passé |
| TC-023-04 | RF-022 | Un équipement est déjà coché (web et mobile) | 1. Décocher un équipement précédemment sélectionné 2. Rechercher | L'équipement disparaît de la sélection et de la requête envoyée (`toggleEquipement` branche `prev.filter(...)`) | Test "retire un équipement décoché de la sélection et de la requête envoyée" ajouté : équipement décoché absent de la requête, l'autre équipement toujours sélectionné et envoyé | ✅ Passé *(re-testé le 2 septembre 2026)* |

**Résumé US-23** *(à jour après comblement du trou)* : 4 cas — 4 ✅ passés, 0 ❌ échoué,
0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé.** Ré-exécution complète : web 134/134 verts, mobile 138/138 verts,
`tsc --noEmit` propre des deux côtés. **US-23 / RF-022 est intégralement couvert.**

---

Périmètre : US-24 (Sprint 8, premier Could have) — messagerie in-app, module Messagerie (RF-023).
Code vérifié : `packages/messagerie-core/src/{useMessages,messagerieApi,types}.ts`,
`web/src/modules/messagerie/components/MessagerieView.tsx`,
`mobile/src/modules/messagerie/screens/MessagerieScreen.tsx`.

> **Note de périmètre** : le lien "Envoyer un message" depuis l'historique (US-18/19) est hors
> périmètre ici — déjà vérifié dans ses propres sessions. Cette session évalue uniquement l'écran
> de conversation lui-même.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-024-01 | RF-023 | Conversation existante avec des messages des deux parties (web et mobile) | 1. Ouvrir la conversation | Les messages s'affichent, distingués visuellement selon l'auteur (`estDeMoi`) | Test "affiche les messages existants de la conversation" : les deux messages affichés | ✅ Passé |
| TC-024-02 | RF-023 | Conversation sans aucun message (web et mobile) | 1. Ouvrir la conversation | Message clair invitant à poser une question | Test "affiche un message clair quand la conversation n'a aucun message" : message affiché | ✅ Passé |
| TC-024-03 | RF-023 | Conversation existante, joueur connecté (web et mobile) | 1. Saisir un message 2. Envoyer | Le message envoyé apparaît immédiatement dans la conversation, sans recharger toute la liste (`POST /api/reservations/:id/messages`) | Test "envoie un nouveau message et l'affiche sans recharger toute la conversation" : message affiché, bon endpoint/méthode appelés | ✅ Passé |
| TC-024-04 | RF-023 | Visiteur non connecté (web et mobile) | 1. Ouvrir la conversation | Message invitant à se connecter affiché | Test "invite à se connecter si l'utilisateur n'a pas de session" : message affiché | ✅ Passé |
| TC-024-05 | RF-023 | Joueur connecté, `GET /api/reservations/:id/messages` répond `ok: false` (web et mobile) | 1. Ouvrir la conversation 2. L'API échoue | Message d'erreur affiché (`error && messages.length === 0`) | Test "affiche une erreur si le chargement de la conversation échoue" ajouté : message affiché | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-024-06 | RF-023 | Conversation existante, `POST /api/reservations/:id/messages` répond `ok: false` (web et mobile) | 1. Saisir un message 2. Envoyer 3. L'API refuse | `sendError` affiché, le message n'apparaît pas dans la conversation (jamais créé côté backend) | Test "affiche une erreur si l'envoi du message échoue..." ajouté : message affiché, message absent de la conversation | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-024-07 | RF-023 | Conversation existante (web et mobile) | 1. Saisir un message 2. Envoyer 3. Observer le champ de saisie avant la résolution de l'appel | Le champ est vidé immédiatement, avant même que l'envoi ne soit résolu (choix UX documenté en commentaire) | Test "vide le champ de saisie immédiatement..." ajouté : champ vide avant résolution de l'appel | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-024-08 | RF-023 | Clic/appui sur "Envoyer" pendant que l'appel est déjà en cours (web et mobile) | 1. Envoyer 2. Observer le bouton avant la résolution de l'appel | Le bouton est désactivé et affiche "Envoi…" | Test "désactive le bouton \"Envoyer\"..." ajouté : bouton désactivé, texte "Envoi…" affiché | ✅ Passé *(re-testé le 2 septembre 2026)* |

**Résumé US-24** *(à jour après comblement des 4 trous)* : 8 cas — 8 ✅ passés, 0 ❌ échoué,
0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé.** Ré-exécution complète : web 138/138 verts, mobile 142/142 verts,
`tsc --noEmit` propre des deux côtés. **US-24 / RF-023 est intégralement couvert.**

---

Périmètre : US-25 (deuxième Could have) — recommandations personnalisées, module Recommandations
(RF-024). Code vérifié : `packages/recherche-core/src/{useRecommandations,recommandationApi,
types}.ts`, `web/src/modules/recherche/components/RecommandationsList.tsx`,
`mobile/src/modules/recherche/screens/RecommandationsScreen.tsx`.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-025-01 | RF-024 | Le joueur a des terrains recommandés (web et mobile) | 1. Ouvrir l'écran recommandations | Les terrains recommandés s'affichent avec un lien vers leur détail et le tarif minimum | Test "affiche les terrains recommandés avec un lien vers leur détail" : lien correct, tarif affiché | ✅ Passé |
| TC-025-02 | RF-024 | Le joueur n'a encore aucune recommandation (web et mobile) | 1. Ouvrir l'écran recommandations | Message clair invitant à réserver un premier créneau pour en recevoir | Test "affiche un message clair quand il n'y a encore aucune recommandation" : message affiché | ✅ Passé |
| TC-025-03 | RF-024 | Visiteur non connecté (web et mobile) | 1. Ouvrir l'écran recommandations | Message invitant à se connecter (contrairement à la recherche US-07, publique, ceci dépend de l'historique personnel) | Test "invite à se connecter si l'utilisateur n'a pas de session" : message affiché | ✅ Passé |
| TC-025-04 | RF-024 | Joueur connecté, `GET /api/recommandations/terrains` répond `ok: false` (web et mobile) | 1. Ouvrir l'écran recommandations 2. L'API échoue | Message d'erreur affiché (`error && recommandations.length === 0`) | Test "affiche une erreur si le chargement des recommandations échoue" ajouté : message affiché | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-025-05 | RF-024 | Un joueur a un historique de réservations | 1. Observer sur quels critères les terrains suggérés sont choisis | RF-024 : "en fonction de son historique de réservations" | **Re-testé le 9 septembre 2026, backend implémenté** (`ObtenirRecommandations`) : sport d'intérêt = union de `UTILISATEUR.sports_pratiques` et des sports déjà réservés (tests Pest "recommande un terrain du même sport que celui déclaré au profil" et "...qu'une réservation passée"), terrains déjà réservés exclus ("découvrir des terrains" — test "n'inclut pas un terrain déjà réservé par ce joueur"), seuls les terrains avec un créneau réellement disponible retenus (test "n'inclut pas un terrain sans créneau disponible") | ✅ Passé *(re-testé le 9 septembre 2026, backend)* |
| TC-025-06 | RF-024 | Aucun sport déclaré, aucun historique de réservation | 1. `GET /api/recommandations/terrains` | Aucune recommandation devinée à défaut de signal exploitable, plutôt qu'une suggestion large arbitraire | **Ajouté le 9 septembre 2026, backend** : test Pest "ne recommande rien sans aucun signal (ni sport déclaré, ni historique)" — liste vide | ✅ Passé *(nouveau, backend)* |

**Résumé US-25** *(à jour après vérification backend du 9 septembre 2026)* : 6 cas — 6 ✅ passés,
0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.

**Aucun bug trouvé.** Ré-exécution complète (9 septembre 2026) : backend 187/187 Pest verts,
web 143/143 verts, mobile 148/148 verts, `tsc --noEmit` propre des deux côtés. **US-25 / RF-024
est intégralement couvert. Algorithme explicitement provisoire** (le SRS ne détaille aucun
critère) — signalé comme tel en code (`ObtenirRecommandations.php`), pas une règle métier tranchée
par le projet.

---

Périmètre : US-26 (Sprints 17/18, dernier Could have) — programme de parrainage, module Parrainage
(RF-025). Code vérifié : `packages/parrainage-core/src/{useParrainage,parrainageApi,types}.ts`,
`web/src/modules/parrainage/components/ParrainageView.tsx`,
`mobile/src/modules/parrainage/screens/ParrainageScreen.tsx`.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-026-01 | RF-025 | Utilisateur connecté avec des filleuls déjà parrainés (web et mobile) | 1. Ouvrir l'écran parrainage | Le code de parrainage et la liste des filleuls s'affichent | Test "affiche le code de parrainage et la liste des filleuls" : code et filleul affichés | ✅ Passé |
| TC-026-02 | RF-025 | Utilisateur connecté sans filleul (web et mobile) | 1. Ouvrir l'écran parrainage | Message clair "Tu n'as encore parrainé personne" | Test "affiche un message clair quand l'utilisateur n'a encore parrainé personne" : message affiché | ✅ Passé |
| TC-026-03 | RF-025 | Utilisateur connecté saisissant un code reçu valide (web et mobile) | 1. Saisir un code 2. Cliquer/toucher "Utiliser" | Confirmation "Code accepté !" affichée, `POST /api/parrainage/utiliser` appelé | Test "utilise un code de parrainage reçu et affiche la confirmation" : confirmation affichée | ✅ Passé |
| TC-026-04 | RF-025 | Code invalide saisi, **web** | 1. Saisir un code invalide 2. Utiliser 3. L'API refuse | Erreur affichée, le champ **reste rempli** pour permettre une correction | Test "affiche une erreur si le code de parrainage est invalide" : erreur affichée, champ toujours à "INVALIDE" | ✅ Passé |
| TC-026-05 | RF-025 | Idem, **parité mobile** | 1. Saisir un code invalide 2. Utiliser 3. L'API refuse | Même comportement que le web | Test "affiche une erreur si le code de parrainage est invalide" ajouté à `ParrainageScreen.test.tsx` : erreur affichée, champ conservé | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-026-06 | RF-025 | Visiteur non connecté (web et mobile) | 1. Ouvrir l'écran parrainage | Message invitant à se connecter | Test "invite à se connecter si l'utilisateur n'a pas de session" : message affiché | ✅ Passé |
| TC-026-07 | RF-025 | Utilisateur connecté, `GET /api/parrainage` répond `ok: false` (web et mobile) | 1. Ouvrir l'écran parrainage 2. L'API échoue | Message d'erreur affiché (`error && !resume`) | Test "affiche une erreur si le chargement du résumé de parrainage échoue" ajouté : message affiché | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-026-08 | RF-025 | Code reçu valide (web et mobile) | 1. Saisir un code 2. Utiliser 3. Observer le champ une fois la confirmation affichée | Le champ est vidé une fois le code accepté (`useEffect` sur `submitted`) | Test "vide le champ une fois le code accepté avec succès" ajouté : champ vide après confirmation | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-026-09 | RF-025 | Clic/appui sur "Utiliser" pendant que l'appel est déjà en cours (web et mobile) | 1. Utiliser 2. Observer le bouton avant la résolution de l'appel | Le bouton est désactivé et affiche "Envoi…" | Test "désactive le bouton \"Utiliser\"..." ajouté : bouton désactivé, texte "Envoi…" affiché | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-026-10 | RF-025 | Un filleul a le statut `en_attente` (avantage pas encore accordé), web et mobile | 1. Ouvrir l'écran parrainage | Le filleul s'affiche avec le libellé "En attente", sans suffixe avantage (`avantage: null`) | Test "affiche un filleul en attente sans suffixe avantage" ajouté : libellé "En attente" affiché seul | ✅ Passé *(re-testé le 2 septembre 2026)* |
| TC-026-11 | RF-025 | Un utilisateur consulte son code, un autre l'utilise | 1. Observer comment le code est généré et l'avantage précis accordé | RF-025 : "parrainer... et suivre les bénéfices associés" | **Re-testé le 9 septembre 2026, backend implémenté** — deux décisions explicites du porteur de projet (`AskUserQuestion`, argent réel en jeu, voir `architecture.md`) : l'avantage profite au **parrain** (pas au filleul), activé immédiatement dès l'usage du code (statut `'valide'` direct), et **réduit réellement** le montant du prochain paiement du parrain (10% provisoire) plutôt que de rester informatif. Code déjà généré à l'inscription (`InscrireUtilisateur`, 8 caractères alphanumériques, valeur technique provisoire signalée). Test Pest "utilise un code de parrainage et active immédiatement l'avantage du parrain" (`ParrainageTest.php`) | ✅ Passé *(re-testé le 9 septembre 2026, backend)* |
| TC-026-12 | RF-025 (bénéfice réellement appliqué, décision explicite) | Le parrain a un parrainage `'valide'` non consommé, il initie un paiement | 1. `POST /api/paiements` pour une réservation du parrain | Le montant réellement facturé (`PAIEMENT.montant`) est réduit de 10%, la ligne PARRAINAGE passe à `'utilise'` et référence le paiement qui l'a consommée | **Ajouté le 9 septembre 2026, backend** : test Pest "applique la réduction de parrainage du parrain sur son paiement" (`InitierPaiementTest.php`) — 10000 → 9000, `parrainage.paiement_id` renseigné | ✅ Passé *(nouveau, backend)* |
| TC-026-13 | RF-025 | Le parrain effectue un second paiement après avoir déjà consommé sa récompense | 1. Initier un premier paiement (consomme la réduction) 2. Initier un second paiement | La réduction ne s'applique qu'une seule fois — usage unique | **Ajouté le 9 septembre 2026, backend** : test Pest "ne consomme pas deux fois la même réduction de parrainage" — second paiement facturé plein tarif | ✅ Passé *(nouveau, backend)* |
| TC-026-14 | RF-025 | Un même filleul essaie d'utiliser un second code de parrainage | 1. Utiliser un code une première fois 2. Utiliser un second code | Refusé (409) — un filleul n'a par construction qu'au plus un parrain (`UTILISATEUR ||--o\| PARRAINAGE`, contrainte unique en base) | **Ajouté le 9 septembre 2026, backend** : test Pest "refuse d'utiliser un second code de parrainage" | ✅ Passé *(nouveau, backend)* |

**Résumé US-26** *(à jour après vérification backend du 9 septembre 2026)* : 14 cas — 14 ✅ passés,
0 ❌ échoué, 0 ⏸️ non exécutable, 0 ◻️ non couvert.

**1 bug trouvé cette session, corrigé le même jour — voir BUG-008 ci-dessous.** Ré-exécution
complète (9 septembre 2026, après correctif) : web 144/144 verts, mobile 149/149 verts,
`tsc --noEmit` propre des deux côtés. **US-26 / RF-025 est maintenant intégralement couvert, côté
backend et côté frontend, sans bug ouvert.**

### Bugs — Backend (9 septembre 2026)

| ID bug | Cas de test | Exigence SRS | Gravité | Description | Attendu (SRS) | Observé | Statut |
|--------|--------------|----------------|----------|----------------|------------------|------------|--------|
| BUG-008 | TC-026-11/12 | RF-025 | Mineur | Le backend introduit `'utilise'` comme valeur réelle de `PARRAINAGE.statut` une fois la récompense consommée (`UtiliserCodeParrainage`/`InitierPaiement`) — une valeur cohérente avec le type ouvert `StatutParrainage` (`(string & {})`, `types.ts`) mais que `STATUT_LABELS` (`web/src/modules/parrainage/components/ParrainageView.tsx:9-12`, `mobile/.../ParrainageScreen.tsx:8-11`) ne connaît pas : seuls `en_attente`/`valide` y sont mappés | Un filleul dont l'avantage a déjà été consommé doit afficher un état clair pour le parrain, sans laisser fuiter une valeur technique brute ni laisser entendre qu'une réduction reste encore à venir | **Corrigé le 9 septembre 2026** : `utilise: 'Avantage utilisé'` ajouté à `STATUT_LABELS` des deux côtés ; le suffixe `avantage` n'est plus affiché une fois `statut === 'utilise'` (devenu trompeur rétrospectivement). Re-vérifié par un test permanent ajouté aux deux suites ("affiche \"Avantage utilisé\" sans le texte d'avantage devenu obsolète") : libellé "Avantage utilisé" affiché seul, ni la valeur brute "utilise" ni "prochaine réservation" ne subsistent | ✅ Corrigé |

### Point d'attention signalé le 9 septembre 2026 — transparence de la réduction de parrainage (résolu le même jour)

`InitierPaiementResult` (`paiementApi.ts`) ne renvoyait que `{ paiementId, checkoutUrl }` — aucun
champ ne permettait au frontend de savoir qu'une réduction de parrainage avait été appliquée au
montant réellement facturé. Le parrain voyait le tarif plein sur l'écran de réservation
(`Reservation.montant`, jamais modifié) sans aucun moyen de constater dans l'app qu'il avait payé
moins. Ce n'était pas un défaut du backend (le calcul était correct et testé, TC-026-12) ni une
exigence explicite de RF-025 — une lacune de transparence, pas un bug.

**Corrigé le 9 septembre 2026, sur demande explicite** : `InitierPaiementResult` gagne `montant`
(montant réellement facturé) et `reductionParrainagePourcentage` (`null` si aucune réduction, pas
`0` — distingue "pas de réduction" de "réduction nulle"). `useInitierPaiement` expose
`montantFacture`/`reductionParrainagePourcentage`, affichés par `PaiementOperateurBouton` (web +
mobile) : "Réduction de parrainage de X% appliquée — montant facturé : Y FCFA." quand une
réduction a été appliquée, rien sinon. Tests Pest étendus (`InitierPaiementTest.php`, structure de
réponse + valeurs avec et sans réduction) et tests frontend ajoutés des deux côtés — backend
190/190, web 146/146, mobile 151/151, `tsc --noEmit` propre des deux côtés.

**Plus aucun point ouvert dans ce rapport à l'issue de cette session.**

---

Périmètre : re-vérification backend Laravel du 9 septembre 2026 — RF-015 (reversement), module
Paiement. Code vérifié : `backend/app/Actions/Paiement/ObtenirReversements.php`,
`backend/app/Http/Resources/Paiement/ReversementResource.php`.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-015-07 | RF-015 | Un paiement passe à `valide` via le webhook (RF-014) | 1. Confirmer un paiement 2. Observer si un reversement (montant net de commission) est effectivement déclenché selon un cycle | RF-015 : "Le système doit **reverser** le montant... **selon un cycle de reversement défini**" | **Tranché et implémenté le 9 septembre 2026** (sur demande explicite, après avoir été signalé la veille) : commission de 10% (provisoire, `config('paiement.commission_pourcentage')`) et cycle **immédiat** — `TraiterWebhookPaiement` calcule réellement `commission`/`montant_net` et marque `statut_reversement` à `'effectue'` (`date_reversement` renseignée) dans la même transaction que la confirmation. Tests Pest "calcule la commission et marque le reversement comme effectué dès la confirmation" (`WebhookPaiementTest.php`) et "affiche la commission et le reversement réellement calculés pour un paiement confirmé" (`ReversementTest.php`, via le vrai webhook plutôt qu'une factory) | ✅ Passé *(tranché et implémenté le 9 septembre 2026)* |

**Constat de cette session (résolu)** : RF-015 est désormais satisfaite — commission et cycle sont
tranchés et réellement calculés, pas seulement consultés. **Bug réel trouvé en implémentant** :
`Paiement` n'avait pas `commission`/`montant_net`/`statut_reversement`/`date_reversement` dans son
`#[Fillable]` — `update()` les ignorait silencieusement sans lever d'erreur ; découvert par un
test qui vérifiait la valeur réellement persistée, corrigé immédiatement, documenté dans
`dev-laravel/SKILL.md`. **Limite qui subsiste, assumée et documentée en code (`config/
paiement.php`)** : aucun virement réel n'a jamais lieu (pas d'API de payout Wave/Orange Money/Moov
Money intégrée) — "reversé" ne fait que marquer une ligne en base, une simulation comme les trois
adaptateurs de paiement. Risque signalé pour une vraie mise en production : un reversement marqué
immédiatement "effectué" puis suivi d'un remboursement d'annulation (RF-021) crée un risque de
double versement, sans mécanisme de recouvrement construit ici.

---

Périmètre : re-vérification backend Laravel du 9 septembre 2026 — RF-016/RF-017 (Notation &
Réputation), RF-018/RF-019 (Historique). Code vérifié :
`backend/app/Actions/Notation/{CreerNotation,ObtenirNoteMoyenne}.php`,
`backend/app/Actions/Historique/ObtenirHistorique.php`.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-016-08 | RF-016 | Réservation confirmée, créneau pas encore terminé | 1. Tenter une notation avant la fin de la session | RF-016 : "après la session" | **Ajouté le 9 septembre 2026, backend** : tests Pest "refuse de noter une session pas encore confirmée" et "...confirmée mais pas encore passée" (`CreateNotationTest.php`) — 409 dans les deux cas | ✅ Passé *(nouveau, backend)* |
| TC-016-09 | RF-016 | Un utilisateur tente de noter une réservation à laquelle il n'a pas pris part | 1. `POST /api/notations` avec un auteur/une cible hors de la réservation | Refusé — seules les deux parties réelles (joueur, propriétaire) peuvent s'évaluer mutuellement | **Ajouté le 9 septembre 2026, backend** : tests Pest "refuse si l'auteur ne fait pas partie de la réservation" / "...si la cible ne fait pas partie..." | ✅ Passé *(nouveau, backend)* |
| TC-016-10 | RF-016 (garde-fou d'intégrité, pas une règle SRS explicite) | Un auteur a déjà noté cette réservation | 1. Noter une seconde fois la même session | Refusé (409) — une seule notation par (réservation, auteur), contrainte unique en base | **Ajouté le 9 septembre 2026, backend** : test Pest "refuse de noter deux fois la même session" | ✅ Passé *(nouveau, backend)* |
| TC-017-04 | RF-017 | Un utilisateur a reçu plusieurs notations | 1. `GET /api/utilisateurs/:id/note` | La moyenne est calculée à la volée par agrégat, arrondie à une décimale ; ne compte que les avis **reçus**, pas donnés | **Ajouté le 9 septembre 2026, backend** : tests Pest "arrondit la moyenne à une décimale" et "ne compte que les avis reçus par cet utilisateur, pas ceux qu'il a donnés" (`NoteMoyenneTest.php`) | ✅ Passé *(nouveau, backend)* |
| TC-018-06 | RF-018 | Un joueur a plusieurs réservations à des dates différentes | 1. `GET /api/reservations/mes-reservations` | L'historique est trié du plus récent au plus ancien | **Ajouté le 9 septembre 2026, backend** : test Pest "trie l'historique du plus récent au plus ancien" (`HistoriqueTest.php`) | ✅ Passé *(nouveau, backend)* |
| TC-019-07 | RF-019 | Un propriétaire a plusieurs terrains, un autre propriétaire a aussi des réservations | 1. `GET /api/reservations/recues` | Seules les réservations sur les terrains **de ce propriétaire** apparaissent | **Ajouté le 9 septembre 2026, backend** : test Pest "n'affiche pas les réservations reçues sur le terrain d'un autre propriétaire" | ✅ Passé *(nouveau, backend)* |

**Aucun bug trouvé.** RF-016/017/018/019 sont désormais vérifiées à la fois côté frontend
(sessions précédentes) et côté backend réel (cette session) — **entièrement couvertes des deux
côtés.**

---

Périmètre : re-vérification backend Laravel du 9 septembre 2026 — RF-007/RF-008/RF-009/RF-022
(Recherche & Catalogue). Code vérifié : `backend/app/Actions/Recherche/{RechercherTerrains,
ObtenirDetailTerrain}.php`.

> **Limite déjà signalée en session US-07/US-09, désormais partiellement levée** : le mécanisme
> de filtrage/tri existe réellement et est testé (18 tests Pest, `RechercheTest.php`/
> `TerrainDetailTest.php`) — mais le tri par proximité **n'utilise finalement pas PostGIS**
> (contrairement à ce qu'annonçait `architecture.md`) : `TERRAIN` ne stocke que des
> `latitude`/`longitude` en `float`, et la distance est calculée par la formule de Haversine côté
> PHP, sur l'ensemble déjà filtré — voir la correction du 9 septembre 2026 dans `architecture.md`
> section 4. Comportement fonctionnellement conforme à RF-007 ("triés/filtrés par proximité"),
> mais avec une limite de performance à surveiller si le catalogue grossit significativement
> (calcul en PHP plutôt qu'en SQL spatial indexé).

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-007-09 | RF-007/RF-008 | Créneaux de plusieurs sports/dates/heures en base | 1. `GET /api/recherche/terrains` avec `sport`/`date`/`heure` | Seuls les créneaux `disponible`, à venir, correspondant aux filtres apparaissent | **Ajouté le 9 septembre 2026, backend** : tests Pest "filtre par sport", "filtre par date", "filtre par heure : ne garde que les créneaux à partir de cette heure" (`RechercheTest.php`) | ✅ Passé *(nouveau, backend)* |
| TC-007-10 | RF-007 | Créneau déjà réservé ou déjà commencé | 1. `GET /api/recherche/terrains` | RF-008 : n'afficher que "les créneaux réellement disponibles" | **Ajouté le 9 septembre 2026, backend** : tests Pest "n'inclut pas un créneau déjà réservé" et "...déjà commencé" | ✅ Passé *(nouveau, backend)* |
| TC-009-07 | RF-007 (proximité) | Terrains à des distances différentes, position fournie | 1. `GET /api/recherche/terrains?latitude=...&longitude=...` | Les résultats sont triés du plus proche au plus loin, `distanceKm` calculée | **Ajouté le 9 septembre 2026, backend** : test Pest "calcule la distance et trie du plus proche au plus loin quand une position est fournie" | ✅ Passé *(nouveau, backend)* |
| TC-008-09 | RF-009 | Terrain avec créneaux réservés et à venir, avis existants | 1. `GET /api/terrains/:id/detail` | Seuls les créneaux réellement disponibles apparaissent ; la note moyenne du propriétaire est affichée | **Ajouté le 9 septembre 2026, backend** : tests Pest "n'inclut pas les créneaux déjà réservés ni déjà commencés" et "affiche la note moyenne du propriétaire quand des avis existent" (`TerrainDetailTest.php`) | ✅ Passé *(nouveau, backend)* |
| TC-023-05 | RF-022 | Terrains avec des sous-ensembles différents d'équipements | 1. `GET /api/recherche/terrains?equipements=vestiaires,eclairage` | RF-022 : filtrer par équipements — seuls les terrains possédant **tous** les équipements sélectionnés apparaissent | **Ajouté le 9 septembre 2026, backend** : test Pest "filtre par équipements : exige la totalité des équipements sélectionnés" | ✅ Passé *(nouveau, backend)* |
| TC-023-06 | RF-022 (distance max, prudence sur les positions inconnues) | Terrain sans coordonnées connues (géocodage jamais confirmé), filtre `distanceMaxKm` actif | 1. `GET /api/recherche/terrains?...&distanceMaxKm=50` | Un terrain dont la position est inconnue est exclu par prudence plutôt qu'inclus par défaut | **Ajouté le 9 septembre 2026, backend** : test Pest "exclut un terrain sans coordonnées connues quand distanceMaxKm est actif" | ✅ Passé *(nouveau, backend)* |

**Aucun bug trouvé.** RF-007/008/009/022 sont désormais entièrement couvertes côté backend réel
(14 tests Pest sur la recherche, 4 sur le détail), en plus de la couverture frontend déjà acquise.

---

Périmètre : vérification backend Laravel du 9 septembre 2026 — RF-023 (Messagerie in-app),
module entièrement nouveau côté backend (aucune session QA backend préalable, le module n'existait
pas avant cette session). Code vérifié : `backend/app/Actions/Messagerie/{ObtenirMessages,
EnvoyerMessage}.php`.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-024-09 | RF-023 | Une réservation a des messages échangés | 1. `GET /api/reservations/:id/messages` par chacune des deux parties | `estDeMoi` reflète l'utilisateur qui consulte, pas un état stocké — le même message s'affiche différemment pour chacun | **Ajouté le 9 septembre 2026, backend** : test Pest "estDeMoi reflète l'utilisateur qui consulte, pas un état stocké" (`MessagerieTest.php`) | ✅ Passé *(nouveau, backend)* |
| TC-024-10 | RF-023 | Un utilisateur tiers, sans lien avec la réservation | 1. `GET`/`POST .../messages` | RF-023 : "un échange... entre un joueur et un propriétaire/gestionnaire" — refusé pour quiconque d'autre | **Ajouté le 9 septembre 2026, backend** : tests Pest "refuse de consulter la conversation d'une réservation à laquelle on ne participe pas" et "refuse d'envoyer un message à une réservation à laquelle on ne participe pas" | ✅ Passé *(nouveau, backend)* |
| TC-024-11 | RF-023 | Plusieurs messages échangés à des instants différents | 1. `GET /api/reservations/:id/messages` | Les messages s'affichent dans l'ordre chronologique | **Ajouté le 9 septembre 2026, backend** : test Pest "affiche les messages dans l'ordre chronologique" | ✅ Passé *(nouveau, backend)* |

**Aucun bug trouvé.** **RF-023 est désormais entièrement implémentée et testée côté backend** —
elle n'avait auparavant qu'une couverture frontend contre un mock.

---

Périmètre : vérification backend Laravel du 9 septembre 2026 — RF-011/RF-012/RF-013/RF-014
(webhook de confirmation de paiement), en complément des sessions US-12/13/14 ci-dessus qui ne
portaient que sur le frontend générique. Code vérifié :
`backend/app/Actions/Paiement/TraiterWebhookPaiement.php`,
`backend/app/Http/Controllers/Api/Paiement/WebhookPaiementController.php`.

> Cette session **lève partiellement** la limite signalée dans les sessions US-12/13/14 ("Wave,
> Orange Money et Moov Money sont trois API réelles distinctes... rien ne peut garantir que ces
> différences réelles sont correctement gérées") : le contrat Laravel commun (webhook, signature,
> confirmation/échec) est maintenant réel et testé. **Ce qui reste non vérifiable ici** : les
> trois adaptateurs (`WaveGateway`/`OrangeMoneyGateway`/`MoovMoneyGateway`) sont des
> **simulations** (`config('paiement.simulation')`, `checkoutUrl` interne, pas un vrai appel aux
> API des opérateurs) — aucun identifiant/sandbox réel n'est accessible dans cet environnement. La
> forme exacte du webhook (signature par secret partagé, payload `{ paiementId, statut }`) est
> elle-même un choix provisoire documenté, pas la spécification réelle de Wave/Orange Money/Moov
> Money.

| ID | Exigence(s) SRS | Préconditions | Étapes | Résultat attendu | Résultat obtenu | Statut |
|----|-------------------|-----------------|--------|----------------------|---------------------|--------|
| TC-014-05 | RF-014 | Paiement `en_attente`, webhook signale un échec | 1. `POST /api/paiements/webhook/:operateur` avec `statut: 'echoue'` | "En cas d'échec de paiement, le créneau doit redevenir disponible" | **Ajouté le 9 septembre 2026, backend** : test Pest "annule la réservation et libère le créneau quand le webhook signale un échec" | ✅ Passé *(nouveau, backend)* |
| TC-014-06 | RF-011/012/013 (sécurité du webhook, RNF-002) | Un tiers appelle le webhook sans connaître le secret partagé | 1. `POST /api/paiements/webhook/:operateur` avec une signature invalide ou absente | Refusé — un attaquant ne doit pas pouvoir confirmer arbitrairement un paiement | **Ajouté le 9 septembre 2026, backend** : tests Pest "refuse un webhook sans signature valide" et "...sans en-tête de signature du tout" | ✅ Passé *(nouveau, backend)* |
| TC-014-07 | RF-014 | Webhook déjà traité (paiement plus `en_attente`) | 1. Renvoyer le même webhook une seconde fois (comportement réel de retry des opérateurs) | Idempotence — pas de double confirmation/notification | **Ajouté le 9 septembre 2026, backend** : test Pest "ignore un webhook déjà traité plutôt que de le retraiter" | ✅ Passé *(nouveau, backend)* |

**Aucun bug trouvé.** Le contrat backend du chemin critique (RF-011 à RF-014) est maintenant
réellement testé, y compris sa sécurité (signature) et son idempotence — au-delà de ce qu'une
suite frontend contre un mock pouvait jamais garantir. **La limite sur les trois vraies API
d'opérateurs reste entière** (voir l'encadré ci-dessus) : à revérifier une fois des
identifiants/sandbox réels disponibles.

### Session du 9 septembre 2026 (première vérification du backend Laravel réel)

- **Périmètre testé** : tous les modules dont le backend a été livré au fil de cette session —
  Paiement (US-12 à US-15, dont le webhook), Notation & Réputation (US-16/17), Historique
  (US-18/19), Notifications (US-20/21), Annulation (US-22, politique révisée en paliers
  configurables par terrain + frais dégressifs), Recherche & Catalogue (US-07/08/09/23),
  Messagerie (US-24), Recommandations (US-25) et Parrainage (US-26, réduction réellement
  appliquée sur un paiement). Jusqu'ici, chaque session QA de ce rapport ne pouvait tester que le
  frontend contre un `fetch` mocké — c'est la première session qui vérifie le comportement réel
  du backend, contre la suite Pest livrée avec (`php artisan test`).
- **39 cas de test** ajoutés ou re-vérifiés cette session (TC-014-05 à 07, TC-015-07, TC-016-08 à
  10, TC-017-04, TC-018-06, TC-019-07, TC-020-08/09, TC-021-05/07, TC-022-08 à 12, TC-023-05/06,
  TC-024-09 à 11, TC-025-05/06, TC-026-11 à 14, TC-007-09/10, TC-008-09, TC-009-07) — 37 ✅ passés,
  0 ❌ échoué, 2 ⏸️ non exécutables (délivrance push/SMS/email réelle hors de l'application ;
  cycle de reversement/commission RF-015, décision métier volontairement différée), 0 ◻️ non
  couvert.
- **Preuve d'exécution réelle** : backend 187/187 tests Pest verts (433 assertions), web 143/143
  verts, mobile 148/148 verts, `tsc --noEmit` propre des deux côtés — vérifié en exécutant les
  suites, pas supposé.
- **1 bug trouvé, corrigé le même jour** : BUG-008 (Mineur) — le statut `'utilise'` d'un
  parrainage consommé n'était pas traduit côté frontend (`STATUT_LABELS`), et le texte d'avantage
  restait formulé au futur une fois la récompense déjà utilisée. Corrigé (`utilise: 'Avantage
  utilisé'` ajouté des deux côtés, suffixe `avantage` supprimé une fois consommé), re-vérifié par
  un test permanent ajouté aux deux suites — web 144/144 verts, mobile 149/149 verts.
- **1 non-conformité SRS réelle signalée, pas un bug de code** : RF-015 ("reverser... selon un
  cycle de reversement défini") n'a aucune implémentation de reversement effectif — seule la
  consultation des paiements éligibles existe. Décision explicitement différée avec l'utilisateur
  pendant l'implémentation (US-15), mais reste un écart réel avec le texte du SRS à trancher avant
  toute mise en production.
- **1 point de transparence signalé, pas un bug** : rien ne permet au frontend d'afficher au
  parrain que son paiement a été réduit par une récompense de parrainage
  (`InitierPaiementResult` ne renvoie pas le montant réel facturé).
- **2 écarts de traçabilité documentés, décisions explicites du porteur de projet, pas des
  dérives silencieuses** : RF-021 est livrée comme une politique par terrain (paliers illimités),
  pas le seuil unique suggéré par le texte littéral ; RF-004/RF-005 gagnent une précondition de
  publication (au moins un palier configuré) non présente dans le texte SRS d'origine — les deux
  sont documentés dans `architecture.md` (corrections du 9 septembre 2026).
- **1 limite déjà connue, confirmée toujours présente** : les trois adaptateurs de paiement
  (Wave/Orange Money/Moov Money) restent des simulations — aucun identifiant/sandbox réel
  accessible dans cet environnement. Le contrat Laravel commun (webhook, signature, confirmation),
  lui, est désormais réel et testé.
- **Recommandation restante** : trancher le taux de commission et le cycle de reversement de
  RF-015 avant toute mise en production réelle, et décider si le montant réellement facturé
  (post-réduction parrainage) doit être exposé au frontend.

### Session du 9 septembre 2026 (correction de BUG-008)

- **BUG-008 corrigé** : `utilise: 'Avantage utilisé'` ajouté à `STATUT_LABELS`
  (`ParrainageView.tsx`/`ParrainageScreen.tsx`), suffixe `avantage` masqué une fois
  `statut === 'utilise'`. Un test permanent ajouté aux deux suites reproduit et verrouille le
  correctif.
- Ré-exécution complète : web 144/144 verts, mobile 149/149 verts, `tsc --noEmit` propre des deux
  côtés — aucune régression.
- **Aucun bug ouvert dans ce rapport à l'issue de cette session.**

**Avec ces deux sessions, l'ensemble des modules livrés (US-07 à US-26) est vérifié à la fois côté
frontend et côté backend réel, sans bug ouvert — à l'exception des deux limites externes
inhérentes à cet environnement (API réelles Wave/Orange Money/Moov Money, service de notification
push/SMS/email réel) et de la décision métier RF-015 volontairement laissée ouverte.**

### Session du 9 septembre 2026 (RF-015 tranchée : commission et cycle de reversement)

- **Décision explicite du porteur de projet** (`AskUserQuestion`, argent réel en jeu) : commission
  de 10% (provisoire, `config('paiement.commission_pourcentage')`) et cycle **immédiat** — le
  reversement est marqué effectué dans la même opération que la confirmation du paiement (RF-014),
  pas différé à une tâche planifiée groupée.
- `TraiterWebhookPaiement` calcule désormais réellement `commission`/`montant_net` (sur le montant
  effectivement facturé, net d'une éventuelle réduction de parrainage US-26) et marque
  `statut_reversement` à `'effectue'` avec `date_reversement` renseignée.
- **1 bug réel trouvé et corrigé en implémentant** : `Paiement` n'avait pas
  `commission`/`montant_net`/`statut_reversement`/`date_reversement` dans son `#[Fillable]` —
  `update()` les ignorait silencieusement (aucune erreur levée), un test qui vérifiait la valeur
  réellement persistée l'a révélé. Documenté dans `dev-laravel/SKILL.md`.
- TC-015-07 mis à jour de ⏸️ Non exécutable à ✅ Passé. 2 tests Pest ajoutés à
  `WebhookPaiementTest.php`, 1 test ajouté à `ReversementTest.php` (chemin réel via webhook, pas
  seulement une factory).
- Ré-exécution complète : backend 190/190 Pest verts (444 assertions), web/mobile inchangés côté
  frontend (aucun changement de contrat), `tsc --noEmit` propre des deux côtés.
- **Limite assumée qui subsiste, documentée en code (`config/paiement.php`)** : aucun virement réel
  n'a jamais lieu (pas d'API de payout Wave/Orange Money/Moov Money) — "reversé" reste une
  simulation, comme les trois adaptateurs de paiement. Un reversement immédiat suivi d'un
  remboursement d'annulation (RF-021) crée un risque de double versement non traité ici — à
  concevoir avant une vraie mise en production.

**RF-015 est désormais entièrement satisfaite par le backend livré. Les seules limites restantes
dans ce rapport sont les deux dépendances externes inaccessibles dans cet environnement (API
réelles des opérateurs de paiement, service de notification push/SMS/email réel) — aucune
décision métier ouverte, aucun bug ouvert.**

### Session du 9 septembre 2026 (transparence de la réduction de parrainage)

- **Traité sur demande explicite** : `InitierPaiementResult` gagne `montant` (montant réellement
  facturé) et `reductionParrainagePourcentage` (`null` si aucune réduction) — `PaiementOperateurBouton`
  (web + mobile) affiche désormais un message quand une réduction de parrainage a été appliquée.
- **Piège évité en implémentant** : `undefined` (mock/backend incomplet) ≠ `null` en JS — un
  simple `setReductionParrainagePourcentage(result.reductionParrainagePourcentage)` aurait laissé
  passer `undefined` et affiché "undefined%" dans les tests existants (mocks antérieurs à ce
  champ) ; corrigé avec `?? null` dans `useInitierPaiement`.
- Tests Pest étendus (structure de réponse, valeurs avec et sans réduction), tests frontend
  ajoutés des deux côtés (affichage et non-affichage du message).
- Ré-exécution complète : backend 190/190 Pest verts (457 assertions), web 146/146 verts, mobile
  151/151 verts, `tsc --noEmit` propre des deux côtés — aucune régression.

**Avec cette session, plus aucun point ouvert ne subsiste dans ce rapport — décisions métier,
bugs et lacunes de transparence signalés ont tous été tranchés ou corrigés. Les seules limites
restantes sont les deux dépendances externes structurellement inaccessibles dans cet environnement
(API réelles Wave/Orange Money/Moov Money, service de notification push/SMS/email réel).**
