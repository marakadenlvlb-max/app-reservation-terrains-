import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useEnregistrerPushToken } from '@app/notification-core';

export interface UsePushRegistrationOptions {
  apiBaseUrl: string;
  token: string | null;
}

export interface UsePushRegistrationResult {
  registering: boolean;
  registerError: string | null;
  /** `null` = pas encore demandée/déterminée ; sinon reflète la réponse de l'utilisateur au prompt système. */
  permissionStatus: Notifications.PermissionStatus | null;
}

/**
 * Enregistrement du jeton push de l'appareil — US-20/US-21 côté mobile uniquement (RF-020,
 * canal FCM). Sans jeton enregistré côté backend, aucune notification push ne peut être
 * délivrée à cet appareil, même si le backend en génère une (confirmation/rappel).
 *
 * TODO: `getExpoPushTokenAsync` accepte un `projectId` (via expo-constants) requis pour un vrai
 * build EAS — omis ici pour rester simple en dev ; à ajouter avant une mise en production.
 * TODO: ce hook est appelé depuis NotificationsScreen faute d'un point d'entrée applicatif
 * global (pas de routeur en place, voir les mêmes limites ailleurs dans le projet) — l'endroit
 * le plus juste serait un enregistrement automatique une fois après connexion, pas seulement
 * quand l'utilisateur visite cet écran précis.
 */
export function usePushRegistration({ apiBaseUrl, token }: UsePushRegistrationOptions): UsePushRegistrationResult {
  const { registering, registerError, enregistrer } = useEnregistrerPushToken({ apiBaseUrl, token });
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (cancelled) return;
      setPermissionStatus(finalStatus);

      if (finalStatus !== 'granted') {
        // L'utilisateur a refusé : rien à enregistrer, mais ce n'est pas une erreur applicative.
        return;
      }

      const { data: pushToken } = await Notifications.getExpoPushTokenAsync();
      if (!cancelled) {
        void enregistrer(pushToken);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, enregistrer]);

  return { registering, registerError, permissionStatus };
}
