import { useCallback, useState } from 'react';
import { logoutUser } from './loginApi';
import type { SessionStorage } from './session';

export interface UseLogoutOptions {
  apiBaseUrl: string;
  sessionStorage: SessionStorage;
  onLoggedOut?: () => void;
}

export interface UseLogoutResult {
  loggingOut: boolean;
  logout: () => Promise<void>;
}

/**
 * Déconnexion — US-02 / RF-002. On efface toujours la session locale, même si l'appel au backend
 * échoue (token déjà expiré, backend injoignable...) : côté utilisateur, "se déconnecter" doit
 * marcher immédiatement sur son propre appareil, indépendamment de l'état du serveur.
 */
export function useLogout({
  apiBaseUrl,
  sessionStorage,
  onLoggedOut,
}: UseLogoutOptions): UseLogoutResult {
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    try {
      const token = await sessionStorage.getToken();
      if (token) {
        await logoutUser(apiBaseUrl, token).catch(() => {
          // Volontairement silencieux : voir le commentaire au-dessus de la fonction.
        });
      }
    } finally {
      await sessionStorage.clearToken();
      setLoggingOut(false);
      onLoggedOut?.();
    }
  }, [apiBaseUrl, sessionStorage, onLoggedOut]);

  return { loggingOut, logout };
}
