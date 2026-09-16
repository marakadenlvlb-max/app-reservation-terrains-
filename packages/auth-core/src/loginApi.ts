import type { LoginPayload, LoginResult } from './types';

/**
 * Appel à l'API backend (Laravel, module Authentification & Profils — architecture.md section 2)
 * pour la connexion — RF-002. Endpoint implémenté et testé côté backend (skill dev-laravel,
 * `backend/app/Http/Controllers/Api/Authentification/AuthController.php`) : un token de session
 * (Sanctum) dans le corps JSON (utilisé tel quel par le mobile, voir `mobileSessionStorage`)
 * **et**, depuis la correction RNF-002 du 31 août 2026 (BUG-001, `rapport-qa.md`), un cookie
 * `Set-Cookie: ...; HttpOnly; Secure; SameSite=Lax` sur la même réponse — c'est ce cookie,
 * invisible en JS, que `webSessionStorage` utilise réellement côté web (voir sa doc).
 * `credentials: 'include'` est nécessaire ici pour que le navigateur accepte de mémoriser ce
 * cookie.
 */
export async function loginUser(payload: LoginPayload, apiBaseUrl: string): Promise<LoginResult> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // RNF-002 (sécurité) : message volontairement générique — ne jamais préciser si c'est
    // l'identifiant ou le mot de passe qui est incorrect, pour ne pas aider un attaquant à
    // énumérer les comptes existants.
    throw new Error('Identifiant ou mot de passe incorrect.');
  }

  return response.json();
}

/**
 * RF-002 — Invalide la session/le jeton côté serveur. Endpoint implémenté et testé côté backend
 * (skill dev-laravel, AuthController::logout). L'appelant (useLogout) efface la session locale
 * même si cet appel échoue : un backend injoignable ne doit pas empêcher l'utilisateur de se
 * déconnecter sur son propre appareil.
 *
 * `credentials: 'include'` (ajouté le 31 août 2026, BUG-001) : nécessaire côté web pour que le
 * cookie `HttpOnly` de session soit envoyé — c'est ce qui permet au backend de savoir QUEL cookie
 * invalider. Sans effet côté mobile (pas de cookie), qui continue de s'appuyer sur l'en-tête
 * `Authorization` ci-dessous avec le vrai token issu de `expo-secure-store`.
 */
export async function logoutUser(apiBaseUrl: string, token: string): Promise<void> {
  await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });
}
