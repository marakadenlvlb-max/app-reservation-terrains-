import type { Notification } from './types';

/**
 * Appels à l'API backend (Laravel, module Notifications — architecture.md section 2) — RF-020.
 * L'envoi effectif (push FCM, email, SMS) est déclenché par le backend selon le cycle décrit
 * dans l'architecture ; ce module ne fait que consulter le journal des notifications déjà
 * envoyées et enregistrer l'appareil pour recevoir les prochains pushes.
 *
 * TODO: endpoints backend à confirmer/implémenter côté Laravel.
 */
export async function fetchNotifications(apiBaseUrl: string, token: string): Promise<Notification[]> {
  const response = await fetch(`${apiBaseUrl}/api/notifications`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Impossible de charger tes notifications. Réessaie plus tard.');
  }

  return response.json();
}

export async function marquerCommeLue(
  notificationId: string,
  apiBaseUrl: string,
  token: string
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/notifications/${notificationId}/lue`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Le marquage comme lue a échoué.");
  }
}

/**
 * Enregistre le jeton push d'un appareil — condition nécessaire pour que le backend puisse
 * délivrer une notification FCM (RF-020) à CET appareil. Pertinent uniquement côté mobile : le
 * web n'a pas de canal push dans l'architecture (seulement FCM mobile + email/SMS, qui ne
 * nécessitent aucune action du frontend web).
 */
export async function enregistrerPushToken(
  pushToken: string,
  apiBaseUrl: string,
  token: string
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/utilisateurs/moi/push-tokens`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pushToken }),
  });

  if (!response.ok) {
    throw new Error("L'enregistrement du jeton push a échoué.");
  }
}
