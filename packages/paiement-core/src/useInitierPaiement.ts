import { useCallback, useState } from 'react';
import type { Operateur } from './types';
import { initierPaiement } from './paiementApi';

export interface UseInitierPaiementOptions {
  apiBaseUrl: string;
  token: string | null;
}

export interface UseInitierPaiementResult {
  initiating: boolean;
  initiateError: string | null;
  /**
   * Montant réellement facturé lors de la dernière initiation réussie, `null` tant qu'aucune
   * n'a encore abouti — ajouté le 9 septembre 2026 (transparence de la réduction de parrainage,
   * rapport-qa.md) pour que l'appelant puisse l'afficher à côté du bouton de paiement.
   */
  montantFacture: number | null;
  /** Pourcentage de réduction de parrainage appliqué à la dernière initiation, `null` si aucune. */
  reductionParrainagePourcentage: number | null;
  /** Renvoie l'URL de paiement à ouvrir en cas de succès, `null` sinon — l'ouverture elle-même (nouvel onglet web, navigateur intégré mobile) reste à la charge de l'appelant, différente par plateforme. */
  initier: (reservationId: string, operateur: Operateur) => Promise<string | null>;
}

/**
 * Initiation d'un paiement — US-12 / RF-011 (Wave). Partagé entre web et mobile ; ne fait que
 * l'appel API et renvoie l'URL de paiement, sans savoir comment elle sera ouverte (voir le
 * commentaire sur `initier`).
 */
export function useInitierPaiement({ apiBaseUrl, token }: UseInitierPaiementOptions): UseInitierPaiementResult {
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [montantFacture, setMontantFacture] = useState<number | null>(null);
  const [reductionParrainagePourcentage, setReductionParrainagePourcentage] = useState<number | null>(null);

  const initier = useCallback(
    async (reservationId: string, operateur: Operateur) => {
      if (!token) {
        setInitiateError('Connecte-toi pour payer cette réservation.');
        return null;
      }

      setInitiating(true);
      setInitiateError(null);
      setMontantFacture(null);
      setReductionParrainagePourcentage(null);
      try {
        const result = await initierPaiement(reservationId, operateur, apiBaseUrl, token);
        // `?? null` plutôt qu'une affectation directe : un mock de test (ou un backend plus
        // ancien) qui omettrait ces champs renverrait `undefined`, distinct de `null` en JS — le
        // composant appelant ne teste que `!== null` pour décider d'afficher le message de
        // réduction, `undefined` y échapperait et afficherait "undefined%".
        setMontantFacture(result.montant ?? null);
        setReductionParrainagePourcentage(result.reductionParrainagePourcentage ?? null);
        return result.checkoutUrl;
      } catch (error) {
        setInitiateError(error instanceof Error ? error.message : "L'initialisation du paiement a échoué.");
        return null;
      } finally {
        setInitiating(false);
      }
    },
    [apiBaseUrl, token]
  );

  return { initiating, initiateError, montantFacture, reductionParrainagePourcentage, initier };
}
