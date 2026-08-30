import type { LoginPayload, LoginResult } from './types';

/**
 * Appel à l'API backend (Laravel, module Authentification & Profils — architecture.md section 2)
 * pour la connexion — RF-002.
 *
 * TODO: endpoint backend à confirmer/implémenter côté Laravel. Contrat attendu : un token de
 * session (ex. Sanctum) en cas de succès.
 */
export async function loginUser(payload: LoginPayload, apiBaseUrl: string): Promise<LoginResult> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
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
 * TODO: endpoint backend à confirmer/implémenter côté Laravel — invalide le token côté serveur.
 * RF-002. L'appelant (useLogout) efface la session locale même si cet appel échoue : un backend
 * injoignable ne doit pas empêcher l'utilisateur de se déconnecter sur son propre appareil.
 */
export async function logoutUser(apiBaseUrl: string, token: string): Promise<void> {
  await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}
