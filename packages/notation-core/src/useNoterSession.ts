import { useCallback, useState } from 'react';
import { NOTE_MAX, NOTE_MIN, type Notation } from './types';
import { creerNotation } from './notationApi';

export interface UseNoterSessionOptions {
  apiBaseUrl: string;
  token: string | null;
}

export interface UseNoterSessionResult {
  note: number | null;
  commentaire: string;
  submitting: boolean;
  submitError: string | null;
  submitted: Notation | null;
  setNote: (note: number) => void;
  setCommentaire: (value: string) => void;
  submit: (reservationId: string, cibleId: string) => Promise<void>;
}

/**
 * Notation d'une session — US-16 / RF-016. Partagé entre web et mobile. La seule validation
 * côté client est la présence d'une note dans l'échelle 1-5 ; le commentaire reste optionnel
 * (voir types.ts).
 */
export function useNoterSession({ apiBaseUrl, token }: UseNoterSessionOptions): UseNoterSessionResult {
  const [note, setNote] = useState<number | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Notation | null>(null);

  const submit = useCallback(
    async (reservationId: string, cibleId: string) => {
      if (!token) {
        setSubmitError('Connecte-toi pour laisser une note.');
        return;
      }
      if (note === null || note < NOTE_MIN || note > NOTE_MAX) {
        setSubmitError(`Sélectionne une note entre ${NOTE_MIN} et ${NOTE_MAX}.`);
        return;
      }

      setSubmitting(true);
      setSubmitError(null);
      try {
        const result = await creerNotation(
          { reservationId, cibleId, note, commentaire: commentaire.trim() || undefined },
          apiBaseUrl,
          token
        );
        setSubmitted(result);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "L'envoi de la notation a échoué.");
      } finally {
        setSubmitting(false);
      }
    },
    [note, commentaire, apiBaseUrl, token]
  );

  return { note, commentaire, submitting, submitError, submitted, setNote, setCommentaire, submit };
}
