'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '@app/notification-core';
import { webSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const TYPE_LABELS: Record<string, string> = {
  confirmation_reservation: 'Réservation confirmée',
  rappel_creneau: 'Rappel de créneau',
};

/**
 * Journal des notifications — US-20 (confirmation) / US-21 (rappel), module Notifications
 * (RF-020). L'envoi effectif (push/email/SMS) est déclenché par le backend ; cet écran ne fait
 * que consulter ce qui a déjà été envoyé et marquer comme lu.
 */
export function NotificationsList() {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    webSessionStorage.getToken().then(setToken);
  }, []);

  const { notifications, loading, error, markingId, markAsRead } = useNotifications({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  if (token === undefined || loading) {
    return <p>Chargement de tes notifications…</p>;
  }

  if (error && notifications.length === 0) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-gray-500">Aucune notification pour l'instant.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Mes notifications</h1>
      <ul className="flex flex-col gap-2">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className={`rounded border px-3 py-2 text-sm ${
              notification.lue ? 'border-gray-200' : 'border-blue-400 bg-blue-50'
            }`}
          >
            <p className="font-medium">{TYPE_LABELS[notification.type] ?? notification.titre}</p>
            <p className="text-gray-700">{notification.message}</p>
            <p className="text-xs text-gray-500">{notification.createdAt.replace('T', ' ')}</p>
            {!notification.lue && (
              <button
                type="button"
                onClick={() => void markAsRead(notification.id)}
                disabled={markingId === notification.id}
                className="mt-1 text-xs text-blue-600 underline disabled:opacity-50"
              >
                {markingId === notification.id ? 'Marquage…' : 'Marquer comme lue'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
