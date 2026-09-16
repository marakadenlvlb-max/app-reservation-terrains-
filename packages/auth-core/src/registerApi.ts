import type { RegisterPayload, RegisterResult } from './types';

/**
 * Appel à l'API backend (Laravel, module Authentification & Profils — architecture.md section 2)
 * pour l'inscription — RF-001. Endpoint implémenté et testé côté backend (skill dev-laravel,
 * `backend/app/Http/Controllers/Api/Authentification/AuthController.php`).
 *
 * `apiBaseUrl` est fourni par l'appelant plutôt que lu directement ici : web (Next.js) et mobile
 * (Expo) exposent leurs variables d'environnement publiques sous des préfixes différents
 * (NEXT_PUBLIC_ vs EXPO_PUBLIC_), donc ce module partagé reste agnostique de la plateforme.
 */
export async function registerUser(
  payload: RegisterPayload,
  apiBaseUrl: string
): Promise<RegisterResult> {
  const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "L'inscription a échoué. Réessaie plus tard.");
  }

  return response.json();
}
