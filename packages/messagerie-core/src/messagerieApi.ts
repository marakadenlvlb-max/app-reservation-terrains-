import type { Message } from './types';

/**
 * Appels à l'API backend (Laravel, module Messagerie — architecture.md section 2) — RF-023, une
 * conversation par réservation (le sujet imposé par la user story : "poser une question sur un
 * créneau").
 *
 * Endpoints implémentés et testés côté backend (skill dev-laravel,
 * `backend/app/Http/Controllers/Api/Messagerie/MessagerieController.php`) : réservés aux deux
 * parties de la réservation (le joueur et le propriétaire/gestionnaire du terrain), quel que soit
 * le statut de la réservation (le SRS ne restreint pas la messagerie aux réservations confirmées).
 */
export async function fetchMessages(
  reservationId: string,
  apiBaseUrl: string,
  token: string
): Promise<Message[]> {
  const response = await fetch(`${apiBaseUrl}/api/reservations/${reservationId}/messages`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Impossible de charger la conversation. Réessaie plus tard.');
  }

  return response.json();
}

export async function envoyerMessage(
  reservationId: string,
  contenu: string,
  apiBaseUrl: string,
  token: string
): Promise<Message> {
  const response = await fetch(`${apiBaseUrl}/api/reservations/${reservationId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ contenu }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "L'envoi du message a échoué. Réessaie plus tard.");
  }

  return response.json();
}
