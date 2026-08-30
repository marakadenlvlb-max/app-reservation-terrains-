import { useCallback, useEffect, useState } from 'react';
import type { Notification } from './types';
import { fetchNotifications, marquerCommeLue } from './notificationApi';

export interface UseNotificationsOptions {
  apiBaseUrl: string;
  token: string | null;
}

export interface UseNotificationsResult {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  /** Id de la notification en cours de marquage, ou `null` — utile pour désactiver son bouton pendant l'appel. */
  markingId: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
}

/**
 * Journal des notifications reçues — US-20 (confirmation) / US-21 (rappel), RF-020. Couvre les
 * deux user stories avec le même mécanisme : elles ne diffèrent que par le `type` de la
 * notification affichée, pas par la façon de la charger ou de la marquer comme lue.
 */
export function useNotifications({ apiBaseUrl, token }: UseNotificationsOptions): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Connecte-toi pour voir tes notifications.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchNotifications(apiBaseUrl, token)
      .then((result) => {
        if (!cancelled) setNotifications(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger tes notifications.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, token]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!token) return;

      setMarkingId(notificationId);
      try {
        await marquerCommeLue(notificationId, apiBaseUrl, token);
        // Mise à jour optimiste locale plutôt qu'un rechargement complet de la liste — le
        // backend fait foi en cas d'échec (voir le catch), mais pas besoin d'un aller-retour
        // réseau supplémentaire juste pour refléter un seul champ booléen.
        setNotifications((current) =>
          current.map((n) => (n.id === notificationId ? { ...n, lue: true } : n))
        );
      } catch {
        // Marquage "lue" non critique pour l'usage : on ne bloque pas l'utilisateur avec une
        // erreur bruyante, la notification reste simplement affichée comme non lue.
      } finally {
        setMarkingId(null);
      }
    },
    [apiBaseUrl, token]
  );

  return { notifications, loading, error, markingId, markAsRead };
}
