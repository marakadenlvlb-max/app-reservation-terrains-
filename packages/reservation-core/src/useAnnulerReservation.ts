import { useCallback, useState } from 'react';
import type { AnnulationReponse } from './types';
import { annulerReservation } from './reservationApi';

export interface UseAnnulerReservationOptions {
  apiBaseUrl: string;
  token: string | null;
}

export interface UseAnnulerReservationResult {
  /** Id de la réservation en cours d'annulation, `null` si aucune. Sert à désactiver le bon bouton sans bloquer les autres lignes. */
  annulingId: string | null;
  annulerError: string | null;
  annuler: (reservationId: string) => Promise<AnnulationReponse | null>;
}

/**
 * Annulation d'une réservation — US-22 / RF-021. Partagé entre web et mobile ; utilisé depuis
 * l'historique joueur (HistoriqueList / HistoriqueScreen), qui gère lui-même la mise à jour
 * locale de la liste affichée après une annulation réussie (pas de re-fetch complet, même
 * approche que la mise à jour optimiste du "marquer comme lue" des notifications, US-20).
 */
export function useAnnulerReservation({ apiBaseUrl, token }: UseAnnulerReservationOptions): UseAnnulerReservationResult {
  const [annulingId, setAnnulingId] = useState<string | null>(null);
  const [annulerError, setAnnulerError] = useState<string | null>(null);

  const annuler = useCallback(
    async (reservationId: string) => {
      if (!token) {
        setAnnulerError('Connecte-toi pour annuler une réservation.');
        return null;
      }

      setAnnulingId(reservationId);
      setAnnulerError(null);
      try {
        return await annulerReservation(reservationId, apiBaseUrl, token);
      } catch (error) {
        setAnnulerError(error instanceof Error ? error.message : "L'annulation a échoué.");
        return null;
      } finally {
        setAnnulingId(null);
      }
    },
    [apiBaseUrl, token]
  );

  return { annulingId, annulerError, annuler };
}
