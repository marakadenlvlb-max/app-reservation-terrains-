import { useEffect, useState } from 'react';
import type { Reservation, ReservationStatut } from './types';
import { fetchReservation } from './reservationApi';

const POLL_INTERVAL_MS = 4000;
// Marge après l'expiration du verrou pendant laquelle on continue à vérifier — un paiement
// validé dans les toutes dernières secondes peut mettre un instant à être traité côté backend
// (webhook de l'opérateur). Passé ce délai, ça n'a plus de sens de continuer à interroger.
const GRACE_PERIOD_MS = 30_000;

function isTerminal(statut: ReservationStatut): boolean {
  return statut === 'confirmee' || statut === 'annulee';
}

export interface UseReservationStatusOptions {
  /** `null` = aucune réservation en cours à surveiller — le hook reste inactif. */
  reservationId: string | null;
  /** Échéance du verrou temporaire (US-10) — sert à borner la durée du polling, voir GRACE_PERIOD_MS. */
  expireA: string | null;
  apiBaseUrl: string;
  token: string | null;
}

export interface UseReservationStatusResult {
  reservation: Reservation | null;
  polling: boolean;
  error: string | null;
}

/**
 * Détection de la confirmation d'une réservation — US-11 / RF-014. Interroge périodiquement le
 * statut de la réservation jusqu'à ce qu'il devienne terminal ('confirmee' ou 'annulee') : c'est
 * le seul moyen pour le frontend de savoir qu'un paiement a été validé par l'opérateur côté
 * backend, `architecture.md` ne prévoyant pas de canal temps réel (pas de WebSocket).
 *
 * TODO: le déclenchement réel du paiement (Wave/Orange Money/Moov Money) n'existe pas encore —
 * US-12 à US-14. Ce hook part du principe qu'un paiement a été initié par un moyen quelconque
 * une fois la réservation verrouillée (US-10) et se contente d'observer le résultat.
 */
export function useReservationStatus({
  reservationId,
  expireA,
  apiBaseUrl,
  token,
}: UseReservationStatusOptions): UseReservationStatusResult {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reservationId || !token) {
      setReservation(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const stopIfNeeded = (current: Reservation) => {
      const pastGracePeriod = expireA
        ? Date.now() > new Date(expireA).getTime() + GRACE_PERIOD_MS
        : false;
      if ((isTerminal(current.statut) || pastGracePeriod) && timer) {
        clearInterval(timer);
      }
    };

    const poll = async () => {
      setPolling(true);
      try {
        const result = await fetchReservation(reservationId, apiBaseUrl, token);
        if (cancelled) return;
        setReservation(result);
        setError(null);
        stopIfNeeded(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de vérifier le statut.');
      } finally {
        if (!cancelled) setPolling(false);
      }
    };

    void poll();
    timer = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [reservationId, expireA, apiBaseUrl, token]);

  return { reservation, polling, error };
}
