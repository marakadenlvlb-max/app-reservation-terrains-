import { useCallback, useEffect, useState } from 'react';
import type { ParrainageResume } from './types';
import { fetchParrainageResume, utiliserCodeParrainage } from './parrainageApi';

export interface UseParrainageOptions {
  apiBaseUrl: string;
  token: string | null;
}

export interface UseParrainageResult {
  resume: ParrainageResume | null;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  submitError: string | null;
  /** `true` une fois un code accepté avec succès — sert à afficher une confirmation transitoire. */
  submitted: boolean;
  utiliserCode: (code: string) => Promise<void>;
}

/**
 * Parrainage — US-26 / RF-025. Partagé entre web et mobile. Un seul hook pour les deux volets de
 * la user story : consulter son propre code + le suivi des filleuls, et utiliser le code reçu
 * d'un autre utilisateur (les deux actions sont indépendantes mais vivent sur le même écran).
 */
export function useParrainage({ apiBaseUrl, token }: UseParrainageOptions): UseParrainageResult {
  const [resume, setResume] = useState<ParrainageResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Connecte-toi pour voir ton parrainage.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchParrainageResume(apiBaseUrl, token)
      .then((result) => {
        if (!cancelled) setResume(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger ton parrainage.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, token]);

  const utiliserCode = useCallback(
    async (code: string) => {
      if (!token) {
        setSubmitError('Connecte-toi pour utiliser un code de parrainage.');
        return;
      }
      const texte = code.trim();
      if (!texte) return;

      setSubmitting(true);
      setSubmitError(null);
      setSubmitted(false);
      try {
        await utiliserCodeParrainage(texte, apiBaseUrl, token);
        setSubmitted(true);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Ce code de parrainage est invalide.');
      } finally {
        setSubmitting(false);
      }
    },
    [apiBaseUrl, token]
  );

  return { resume, loading, error, submitting, submitError, submitted, utiliserCode };
}
