import { useEffect, useState } from 'react';
import type { ConversationApercu } from './types';
import { fetchMesConversations } from './messagerieApi';

export interface UseMesConversationsOptions {
  apiBaseUrl: string;
  /** Token de session (US-02) — null tant qu'il n'est pas encore lu depuis le stockage local. */
  token: string | null;
}

export interface UseMesConversationsResult {
  conversations: ConversationApercu[];
  loading: boolean;
  error: string | null;
}

/**
 * Liste des conversations du joueur ou propriétaire/gestionnaire connecté — US-27 (module
 * Navigation & Interface globale). Partagé entre web et mobile comme le reste de ce package.
 */
export function useMesConversations({ apiBaseUrl, token }: UseMesConversationsOptions): UseMesConversationsResult {
  const [conversations, setConversations] = useState<ConversationApercu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Connecte-toi pour voir tes conversations.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMesConversations(apiBaseUrl, token)
      .then((result) => {
        if (!cancelled) setConversations(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger tes conversations.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, token]);

  return { conversations, loading, error };
}
