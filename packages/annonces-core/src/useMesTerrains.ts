import { useEffect, useState } from 'react';
import type { Terrain } from './types';
import { fetchMesTerrains } from './terrainApi';

export interface UseMesTerrainsOptions {
  apiBaseUrl: string;
  /** Token de session (US-02) — null tant qu'il n'est pas encore lu depuis le stockage local. */
  token: string | null;
}

export interface UseMesTerrainsResult {
  terrains: Terrain[];
  loading: boolean;
  error: string | null;
}

/**
 * Liste des annonces du propriétaire/gestionnaire connecté — US-27 (module Navigation &
 * Interface globale). Partagé entre web et mobile comme le reste de ce package, même si seul le
 * web en a besoin dans l'immédiat (voir backlog.md, navigation mobile hors périmètre d'US-27).
 */
export function useMesTerrains({ apiBaseUrl, token }: UseMesTerrainsOptions): UseMesTerrainsResult {
  const [terrains, setTerrains] = useState<Terrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Connecte-toi pour voir tes annonces.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMesTerrains(apiBaseUrl, token)
      .then((result) => {
        if (!cancelled) setTerrains(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger tes annonces.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, token]);

  return { terrains, loading, error };
}
