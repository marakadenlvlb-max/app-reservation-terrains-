import { useCallback, useState } from 'react';
import type { Reservation } from './types';
import { initierReservation } from './reservationApi';

export interface UseReserverCreneauOptions {
  apiBaseUrl: string;
  /** Token de session (US-02) — `null` si l'utilisateur n'est pas connecté : réserver exige une session, contrairement à la recherche/consultation (US-07/US-08). */
  token: string | null;
}

export interface UseReserverCreneauResult {
  reservation: Reservation | null;
  reserving: boolean;
  reserveError: string | null;
  /** Renvoie `true` en cas de succès, pour laisser l'appelant décider de la suite (ex. rediriger vers le paiement). */
  reserver: (creneauId: string) => Promise<boolean>;
}

/**
 * Sélection + verrouillage temporaire d'un créneau — US-10 / RF-010. Partagé entre web et
 * mobile. Ne redirige nulle part par lui-même : la suite (paiement, US-11 à US-13) n'existe pas
 * encore, donc ce hook s'arrête à l'obtention de la réservation verrouillée.
 */
export function useReserverCreneau({ apiBaseUrl, token }: UseReserverCreneauOptions): UseReserverCreneauResult {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);

  const reserver = useCallback(
    async (creneauId: string) => {
      if (!token) {
        setReserveError('Connecte-toi pour réserver ce créneau.');
        return false;
      }

      setReserving(true);
      setReserveError(null);
      try {
        const result = await initierReservation(creneauId, apiBaseUrl, token);
        setReservation(result);
        return true;
      } catch (error) {
        setReserveError(error instanceof Error ? error.message : 'La réservation a échoué.');
        return false;
      } finally {
        setReserving(false);
      }
    },
    [apiBaseUrl, token]
  );

  return { reservation, reserving, reserveError, reserver };
}
