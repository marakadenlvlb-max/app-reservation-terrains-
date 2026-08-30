import { useEffect, useState } from 'react';
import type { Reversement } from './types';
import { fetchReversements } from './paiementApi';

export interface UseReversementsOptions {
  apiBaseUrl: string;
  token: string | null;
}

export interface UseReversementsResult {
  reversements: Reversement[];
  loading: boolean;
  error: string | null;
}

/**
 * Chargement de la liste des reversements — US-15 / RF-015. Lecture seule : contrairement aux
 * autres hooks du module Paiement (useInitierPaiement), il n'y a aucune action à déclencher ici,
 * le reversement étant un processus backend automatique — voir le commentaire dans
 * fetchReversements.
 */
export function useReversements({ apiBaseUrl, token }: UseReversementsOptions): UseReversementsResult {
  const [reversements, setReversements] = useState<Reversement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Connecte-toi pour voir tes reversements.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchReversements(apiBaseUrl, token)
      .then((result) => {
        if (!cancelled) setReversements(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger tes reversements.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, token]);

  return { reversements, loading, error };
}
