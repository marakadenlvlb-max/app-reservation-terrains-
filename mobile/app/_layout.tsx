import '../src/global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

/**
 * Layout racine — US-29 (module Navigation & Interface globale, équivalent mobile d'US-27/28
 * côté web). `GestureHandlerRootView` est requis par le drawer (react-native-gesture-handler).
 * Le groupe `(drawer)` porte son propre layout (menu tiroir) ; les écrans hors groupe
 * (connexion, inscription, détails de terrain/réservation) s'empilent par-dessus via ce Stack,
 * masquant temporairement le tiroir — même principe que les pages web hors NavBar.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
