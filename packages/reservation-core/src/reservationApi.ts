import type { AnnulationReponse, Reservation } from './types';

/**
 * Appel à l'API backend (Laravel, module Réservation — architecture.md section 2) pour
 * initier une réservation et verrouiller temporairement un créneau — RF-010.
 *
 * TODO: endpoint backend à confirmer/implémenter côté Laravel. Contrat attendu : le backend
 * refuse (409 par ex.) si le créneau est déjà réservé ou verrouillé par quelqu'un d'autre — le
 * frontend ne fait aucune supposition d'exclusivité lui-même, il relaie simplement l'erreur.
 */
export async function initierReservation(
  creneauId: string,
  apiBaseUrl: string,
  token: string
): Promise<Reservation> {
  const response = await fetch(`${apiBaseUrl}/api/reservations`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ creneauId }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? 'Ce créneau vient peut-être d\'être réservé par quelqu\'un d\'autre. Réessaie.');
  }

  return response.json();
}

/**
 * US-11 / RF-014 : relit le statut d'une réservation. Utilisé pour du polling — architecture.md
 * ne prévoit aucun canal temps réel (pas de WebSocket dans la stack retenue), donc c'est le seul
 * moyen pour le frontend de savoir qu'un paiement a été validé par l'opérateur côté backend, sans
 * action de l'utilisateur. TODO: endpoint backend à confirmer/implémenter côté Laravel.
 */
export async function fetchReservation(
  reservationId: string,
  apiBaseUrl: string,
  token: string
): Promise<Reservation> {
  const response = await fetch(`${apiBaseUrl}/api/reservations/${reservationId}`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Impossible de vérifier le statut de la réservation.');
  }

  return response.json();
}

/**
 * US-22 / RF-021 : demande l'annulation d'une réservation. Le backend décide seul si le délai de
 * la politique d'annulation est respecté (voir le commentaire sur `AnnulationReponse` dans
 * types.ts) et déclenche le remboursement en conséquence — le frontend relaie simplement le
 * résultat. TODO: endpoint backend à confirmer/implémenter côté Laravel.
 */
export async function annulerReservation(
  reservationId: string,
  apiBaseUrl: string,
  token: string
): Promise<AnnulationReponse> {
  const response = await fetch(`${apiBaseUrl}/api/reservations/${reservationId}/annulation`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "L'annulation a échoué. Réessaie plus tard.");
  }

  return response.json();
}
