import type { InitierPaiementResult, Operateur, Reversement } from './types';

/**
 * Appel à l'API backend (Laravel, module Paiement — architecture.md section 2) pour initier un
 * paiement — RF-011 (Wave, US-12). Même endpoint pour les futurs opérateurs (US-13/US-14) : seul
 * `operateur` change, cohérent avec l'adaptateur de paiement commun décrit dans l'architecture.
 *
 * TODO: endpoint backend à confirmer/implémenter côté Laravel, ainsi que le webhook de
 * confirmation asynchrone qu'il reçoit de Wave (architecture.md section 4).
 */
export async function initierPaiement(
  reservationId: string,
  operateur: Operateur,
  apiBaseUrl: string,
  token: string
): Promise<InitierPaiementResult> {
  const response = await fetch(`${apiBaseUrl}/api/paiements`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reservationId, operateur }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "L'initialisation du paiement a échoué. Réessaie plus tard.");
  }

  return response.json();
}

/**
 * Liste des reversements du propriétaire/gestionnaire connecté — US-15 / RF-015. Le backend
 * détermine lui-même quels paiements appartiennent à cet utilisateur (via le token) ; le
 * reversement lui-même est un processus automatique côté backend selon un cycle défini, ce
 * frontend ne fait que consulter son état, jamais le déclencher.
 *
 * TODO: endpoint backend à confirmer/implémenter côté Laravel.
 */
export async function fetchReversements(apiBaseUrl: string, token: string): Promise<Reversement[]> {
  const response = await fetch(`${apiBaseUrl}/api/reversements`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Impossible de charger tes reversements. Réessaie plus tard.');
  }

  return response.json();
}
