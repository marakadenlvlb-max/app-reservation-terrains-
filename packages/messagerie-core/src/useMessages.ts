import { useCallback, useEffect, useState } from 'react';
import type { Message } from './types';
import { envoyerMessage, fetchMessages } from './messagerieApi';

export interface UseMessagesOptions {
  reservationId: string;
  apiBaseUrl: string;
  token: string | null;
}

export interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  sendError: string | null;
  envoyer: (contenu: string) => Promise<void>;
}

/**
 * Conversation liée à une réservation — US-24 / RF-023. Partagé entre web et mobile. Une
 * conversation par réservation (pas de messagerie libre entre utilisateurs) : c'est la portée
 * exacte de RF-023 ("un échange de messages... au sujet d'une réservation").
 */
export function useMessages({ reservationId, apiBaseUrl, token }: UseMessagesOptions): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Connecte-toi pour voir cette conversation.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMessages(reservationId, apiBaseUrl, token)
      .then((result) => {
        if (!cancelled) setMessages(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger la conversation.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reservationId, apiBaseUrl, token]);

  const envoyer = useCallback(
    async (contenu: string) => {
      if (!token) {
        setSendError('Connecte-toi pour envoyer un message.');
        return;
      }
      const texte = contenu.trim();
      if (!texte) return;

      setSending(true);
      setSendError(null);
      try {
        const message = await envoyerMessage(reservationId, texte, apiBaseUrl, token);
        // Ajout local immédiat plutôt qu'un rechargement complet de la conversation — le message
        // vient d'être créé côté backend, pas besoin d'un aller-retour réseau supplémentaire.
        setMessages((current) => [...current, message]);
      } catch (err) {
        setSendError(err instanceof Error ? err.message : "L'envoi du message a échoué.");
      } finally {
        setSending(false);
      }
    },
    [reservationId, apiBaseUrl, token]
  );

  return { messages, loading, error, sending, sendError, envoyer };
}
