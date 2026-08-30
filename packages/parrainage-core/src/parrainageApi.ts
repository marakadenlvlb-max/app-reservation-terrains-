import type { ParrainageResume } from './types';

/**
 * Appels à l'API backend (Laravel, module Parrainage — architecture.md section 2) — RF-025.
 * TODO: endpoints backend à confirmer/implémenter côté Laravel.
 */
export async function fetchParrainageResume(apiBaseUrl: string, token: string): Promise<ParrainageResume> {
  const response = await fetch(`${apiBaseUrl}/api/parrainage`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Impossible de charger ton parrainage. Réessaie plus tard.');
  }

  return response.json();
}

/**
 * Rattache l'utilisateur connecté comme filleul du détenteur du code fourni. Voir l'hypothèse de
 * portée documentée dans architecture.md : la saisie se fait depuis ce module a posteriori, pas
 * au moment de l'inscription (RF-001) — pour ne pas rouvrir le formulaire d'inscription déjà
 * livré (US-01) pour un besoin Could have.
 */
export async function utiliserCodeParrainage(code: string, apiBaseUrl: string, token: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/parrainage/utiliser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? 'Ce code de parrainage est invalide.');
  }
}
