import { useEffect, useState } from 'react';
import type { SessionStorage } from './session';

/**
 * Lit le token de session une fois au montage, en distinguant explicitement trois états :
 * `undefined` tant que la lecture asynchrone n'a pas résolu, puis soit `null` (confirmé non
 * connecté), soit une vraie chaîne (session valide).
 *
 * Centralise un pattern qui a été mal réimplémenté à répétition dans ce projet (voir
 * `rapport-qa.md`, BUG-002/003/004/005) : plusieurs écrans initialisaient leur état token à
 * `null` au lieu de `undefined`, ce qui confond "pas encore lu" avec "confirmé non connecté" —
 * effet observable allant d'un message "Connecte-toi..." qui flashe pour un utilisateur pourtant
 * authentifié (BUG-002/004/005) jusqu'au rejet silencieux d'une action réelle si l'écran reste
 * interactif avant résolution (BUG-003). Un seul hook partagé, testé une fois, plutôt que de
 * corriger la même faute occurrence par occurrence à chaque nouvelle story.
 *
 * `sessionStorage` est injecté (comme pour `useLoginForm`/`useLogout`) plutôt que lu directement
 * ici : web (`localStorage`) et mobile (`expo-secure-store`) ont chacun leur implémentation, ce
 * package partagé reste agnostique de la plateforme.
 */
export function useSessionToken(sessionStorage: SessionStorage): string | null | undefined {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    sessionStorage.getToken().then((value) => {
      if (!cancelled) setToken(value);
    });

    return () => {
      cancelled = true;
    };
  }, [sessionStorage]);

  return token;
}
