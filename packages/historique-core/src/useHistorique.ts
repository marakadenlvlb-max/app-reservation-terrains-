import { useEffect, useState } from 'react';
import type { HistoriqueReservation, HistoriqueRole } from './types';
import { fetchHistorique } from './historiqueApi';

export interface UseHistoriqueOptions {
  role: HistoriqueRole;
  apiBaseUrl: string;
  token: string | null;
}

export interface UseHistoriqueResult {
  reservations: HistoriqueReservation[];
  loading: boolean;
  error: string | null;
}

/**
 * Historique des réservations — US-18 (`role: 'joueur'`) / US-19 (`role: 'proprietaire'`).
 * Partagé entre web et mobile ; lecture seule, comme les reversements (US-15).
 */
export function useHistorique({ role, apiBaseUrl, token }: UseHistoriqueOptions): UseHistoriqueResult {
  const [reservations, setReservations] = useState<HistoriqueReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Connecte-toi pour voir ton historique.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchHistorique(role, apiBaseUrl, token)
      .then((result) => {
        if (!cancelled) setReservations(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger ton historique.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [role, apiBaseUrl, token]);

  return { reservations, loading, error };
}

/**
 * RESERVATION.statut n'a pas de valeur "terminée" distincte dans le modèle de données
 * (architecture.md) — seulement 'en_attente_paiement' / 'confirmee' / 'annulee'. On déduit donc
 * côté frontend qu'une session est terminée (et donc notable, US-16) quand la réservation est
 * confirmée ET que la fin du créneau est déjà passée. Hypothèse à confirmer avec le backend :
 * s'il expose un jour un statut dédié (ex. 'terminee'), le remplacer par une vérification directe.
 */
export function estSessionTerminee(reservation: HistoriqueReservation): boolean {
  return reservation.statut === 'confirmee' && new Date(reservation.creneau.fin).getTime() < Date.now();
}

/**
 * US-22 / RF-021 : une réservation ne peut être proposée à l'annulation que si elle est confirmée
 * et que le créneau n'a pas encore commencé — au-delà, l'annulation n'a plus de sens (la session a
 * déjà eu lieu ou est en cours). Le respect du "délai limite" exact de la politique d'annulation
 * (et donc si un remboursement est dû) reste une décision backend, pas dupliquée ici : voir
 * `annulerReservation` dans @app/reservation-core.
 */
export function estReservationAnnulable(reservation: HistoriqueReservation): boolean {
  return reservation.statut === 'confirmee' && new Date(reservation.creneau.debut).getTime() > Date.now();
}
