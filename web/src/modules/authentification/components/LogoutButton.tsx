'use client';

import { useLogout } from '@app/auth-core';
import { webSessionStorage } from '../sessionStorage';

/**
 * Bouton de déconnexion — US-02 / RF-002. Composant volontairement minimal : toute la logique
 * (appel API + effacement du token) vit dans useLogout, réutilisé tel quel côté mobile.
 */
export function LogoutButton() {
  const { loggingOut, logout } = useLogout({
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
    sessionStorage: webSessionStorage,
    onLoggedOut: () => {
      // TODO: rediriger vers la page de connexion une fois le routing défini.
    },
  });

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={loggingOut}
      className="rounded border border-gray-300 px-4 py-2 font-medium disabled:opacity-50"
    >
      {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
    </button>
  );
}
