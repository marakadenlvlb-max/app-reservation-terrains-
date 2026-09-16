import type { AnnulationReponse, Reservation } from './types';

/**
 * Appel à l'API backend (Laravel, module Réservation — architecture.md section 2) pour
 * initier une réservation et verrouiller temporairement un créneau — RF-010. Endpoint implémenté
 * et testé côté backend (skill dev-laravel,
 * `backend/app/Http/Controllers/Api/Reservation/ReservationController.php`) : le backend refuse
 * bien (409) si le créneau est déjà réservé ou verrouillé par quelqu'un d'autre, via une
 * transaction avec verrou (`lockForUpdate`) pour rester correct en cas de requêtes concurrentes.
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
 * action de l'utilisateur. Endpoint implémenté et testé côté backend (skill dev-laravel) : chaque
 * lecture constate elle-même une éventuelle expiration du verrou (aucun scheduler dans ce dépôt)
 * et bascule alors la réservation en 'annulee' avant de répondre — la transition vers 'confirmee'
 * dépendra du module Paiement (US-12 à US-14), pas encore implémenté côté backend.
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
 * résultat.
 *
 * Endpoint implémenté et testé côté backend (skill dev-laravel,
 * `backend/app/Actions/Reservation/AnnulerReservation.php`) : politique décidée le 9 septembre
 * 2026 faute de valeur chiffrée dans le SRS — remboursement total (net de frais de transaction
 * provisoires) si annulé plus de 24h avant le créneau, aucun remboursement en dessous (voir
 * `backend/config/reservation.php`).
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
