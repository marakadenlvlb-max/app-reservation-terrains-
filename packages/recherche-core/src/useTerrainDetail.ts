import { useEffect, useState } from 'react';
import type { TerrainDetail } from './types';
import { fetchTerrainDetail } from './rechercheApi';

export interface UseTerrainDetailOptions {
  terrainId: string;
  apiBaseUrl: string;
}

export interface UseTerrainDetailResult {
  detail: TerrainDetail | null;
  loading: boolean;
  error: string | null;
}

/**
 * Chargement du détail d'une annonce — US-08 / RF-009. Simple lecture, pas d'action associée ici
 * (réserver un créneau appartient à US-10, pas encore implémenté) — ce hook reste volontairement
 * minimal plutôt que d'anticiper une logique qui n'existe pas encore.
 */
export function useTerrainDetail({ terrainId, apiBaseUrl }: UseTerrainDetailOptions): UseTerrainDetailResult {
  const [detail, setDetail] = useState<TerrainDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTerrainDetail(terrainId, apiBaseUrl)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger l'annonce.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [terrainId, apiBaseUrl]);

  return { detail, loading, error };
}
