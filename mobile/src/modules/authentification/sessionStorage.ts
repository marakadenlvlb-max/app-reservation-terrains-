import * as SecureStore from 'expo-secure-store';
import type { SessionStorage } from '@app/auth-core';

const TOKEN_KEY = 'auth_token';

/**
 * Implémentation mobile du stockage de session — RF-002. expo-secure-store persiste le token
 * dans le keychain (iOS) / keystore (Android) plutôt qu'en clair, cohérent avec RNF-002
 * (chiffrement des données personnelles au repos).
 */
export const mobileSessionStorage: SessionStorage = {
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  setToken: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clearToken: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};
