import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionToken } from '@app/auth-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

/**
 * US-29 (module Navigation & Interface globale, équivalent mobile d'US-28) : point d'entrée de
 * l'app — redirige immédiatement vers `/accueil` (session détectée) ou `/connexion` (aucune
 * session), au lieu d'afficher un écran fixe comme le faisait `App.tsx` (RegisterScreen en dur).
 * Même détection que le drawer (`useSessionToken`).
 */
export function RootRedirect() {
  const router = useRouter();
  const token = useSessionToken(mobileSessionStorage);

  useEffect(() => {
    if (token === undefined) return; // pas encore résolu (voir useSessionToken)
    router.replace(token ? '/accueil' : '/connexion');
  }, [token, router]);

  return <View />;
}
