import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useLogout } from '@app/auth-core';
import { mobileSessionStorage } from '../sessionStorage';

/**
 * Bouton de déconnexion — US-02 / RF-002. Même hook partagé que le web (useLogout) ; seule
 * l'implémentation du stockage de session change (expo-secure-store).
 */
export function LogoutButton() {
  const router = useRouter();

  const { loggingOut, logout } = useLogout({
    apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
    sessionStorage: mobileSessionStorage,
    onLoggedOut: () => {
      // US-29 (module Navigation & Interface globale) referme ce TODO.
      router.replace('/connexion');
    },
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Se déconnecter"
      onPress={() => void logout()}
      disabled={loggingOut}
      className="items-center rounded border border-gray-300 px-4 py-2 disabled:opacity-50"
    >
      {loggingOut ? <ActivityIndicator /> : <Text className="font-medium">Se déconnecter</Text>}
    </Pressable>
  );
}
