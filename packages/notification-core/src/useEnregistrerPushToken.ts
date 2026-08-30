import { useCallback, useState } from 'react';
import { enregistrerPushToken } from './notificationApi';

export interface UseEnregistrerPushTokenOptions {
  apiBaseUrl: string;
  token: string | null;
}

export interface UseEnregistrerPushTokenResult {
  registering: boolean;
  registerError: string | null;
  enregistrer: (pushToken: string) => Promise<void>;
}

/**
 * Enregistrement du jeton push d'un appareil — RF-020, pertinent côté mobile uniquement (voir
 * le commentaire dans notificationApi.ts). L'obtention du jeton lui-même (permission,
 * `expo-notifications`) reste à la charge de l'écran mobile appelant : ce hook ne fait que
 * l'appel réseau, même principe que les autres hooks "core" du projet (ex. useInitierPaiement).
 */
export function useEnregistrerPushToken({
  apiBaseUrl,
  token,
}: UseEnregistrerPushTokenOptions): UseEnregistrerPushTokenResult {
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const enregistrer = useCallback(
    async (pushToken: string) => {
      if (!token) return;

      setRegistering(true);
      setRegisterError(null);
      try {
        await enregistrerPushToken(pushToken, apiBaseUrl, token);
      } catch (error) {
        setRegisterError(error instanceof Error ? error.message : "L'enregistrement du jeton push a échoué.");
      } finally {
        setRegistering(false);
      }
    },
    [apiBaseUrl, token]
  );

  return { registering, registerError, enregistrer };
}
