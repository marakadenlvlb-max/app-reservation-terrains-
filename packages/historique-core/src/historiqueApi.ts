import type { HistoriqueReservation, HistoriqueRole } from './types';

/**
 * Appel à l'API backend (Laravel, module Historique — architecture.md section 2) — RF-018
 * (joueur) / RF-019 (propriétaire/gestionnaire). Deux endpoints distincts plutôt qu'un seul
 * paramétré : le rôle change entièrement la requête côté backend (mes réservations en tant que
 * joueur vs réservations reçues sur mes terrains), ce n'est pas un simple filtre sur les mêmes
 * lignes.
 *
 * TODO: endpoints backend à confirmer/implémenter côté Laravel.
 */
export async function fetchHistorique(
  role: HistoriqueRole,
  apiBaseUrl: string,
  token: string
): Promise<HistoriqueReservation[]> {
  const path = role === 'joueur' ? '/api/reservations/mes-reservations' : '/api/reservations/recues';
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Impossible de charger ton historique. Réessaie plus tard.');
  }

  return response.json();
}
