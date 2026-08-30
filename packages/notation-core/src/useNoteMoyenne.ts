import { useEffect, useState } from 'react';
import type { NoteMoyenne } from './types';
import { fetchNoteMoyenne } from './notationApi';

export interface UseNoteMoyenneOptions {
  utilisateurId: string;
  apiBaseUrl: string;
}

export interface UseNoteMoyenneResult {
  noteMoyenne: NoteMoyenne | null;
  loading: boolean;
  error: string | null;
}

/**
 * Note moyenne d'un utilisateur — US-17 / RF-017. Volontairement public (pas de `token`, voir
 * fetchNoteMoyenne) : pensé pour être réutilisé partout où un profil est affiché (détail
 * d'annonce, futur profil public...), pas seulement dans le formulaire de notation.
 */
export function useNoteMoyenne({ utilisateurId, apiBaseUrl }: UseNoteMoyenneOptions): UseNoteMoyenneResult {
  const [noteMoyenne, setNoteMoyenne] = useState<NoteMoyenne | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchNoteMoyenne(utilisateurId, apiBaseUrl)
      .then((result) => {
        if (!cancelled) setNoteMoyenne(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger la note.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [utilisateurId, apiBaseUrl]);

  return { noteMoyenne, loading, error };
}
