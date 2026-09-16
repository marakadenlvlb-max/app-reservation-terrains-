import type { ParrainageResume } from './types';

/**
 * Appels à l'API backend (Laravel, module Parrainage — architecture.md section 2) — RF-025.
 *
 * Endpoints implémentés et testés côté backend (skill dev-laravel,
 * `backend/app/Http/Controllers/Api/Parrainage/ParrainageController.php`). Décisions explicites
 * du porteur de projet (RF-025 ne précisait ni le bénéficiaire ni la nature de l'avantage) :
 * le code (déjà généré à l'inscription) profite au **parrain**, activé immédiatement dès que le
 * filleul l'utilise, et réduit réellement le montant du prochain paiement du parrain (pas une
 * mention purement informative) — voir la correction du 9 septembre 2026 dans `architecture.md`.
 */
export async function fetchParrainageResume(apiBaseUrl: string, token: string): Promise<ParrainageResume> {
  const response = await fetch(`${apiBaseUrl}/api/parrainage`, {
    credentials: 'include',
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
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? 'Ce code de parrainage est invalide.');
  }
}
