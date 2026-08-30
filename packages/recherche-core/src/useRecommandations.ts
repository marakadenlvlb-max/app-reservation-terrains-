import { useEffect, useState } from 'react';
import type { TerrainRecommande } from './types';
import { fetchRecommandations } from './recommandationApi';

export interface UseRecommandationsOptions {
  apiBaseUrl: string;
  token: string | null;
}

export interface UseRecommandationsResult {
  recommandations: TerrainRecommande[];
  loading: boolean;
  error: string | null;
}

/**
 * Suggestions de terrains basées sur l'historique du joueur — US-25 / RF-024. Partagé entre web
 * et mobile ; lecture seule, comme les reversements (US-15) ou les recommandations n'ont rien à
 * marquer/modifier côté frontend.
 */
export function useRecommandations({ apiBaseUrl, token }: UseRecommandationsOptions): UseRecommandationsResult {
  const [recommandations, setRecommandations] = useState<TerrainRecommande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Connecte-toi pour voir tes recommandations.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRecommandations(apiBaseUrl, token)
      .then((result) => {
        if (!cancelled) setRecommandations(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger tes recommandations.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, token]);

  return { recommandations, loading, error };
}
