import '../src/global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

/**
 * Layout racine — US-29 (module Navigation & Interface globale, équivalent mobile d'US-27/28
 * côté web). `GestureHandlerRootView` est requis par le drawer (react-native-gesture-handler).
 * Le groupe `(drawer)` porte son propre layout (menu tiroir) ; les écrans hors groupe
 * (connexion, inscription, détails de terrain/réservation) s'empilent par-dessus via ce Stack,
 * masquant temporairement le tiroir — même principe que les pages web hors NavBar.
 *
 * `SafeAreaProvider` (indispensable pour `useSafeAreaInsets`, voir les écrans hors tiroir) —
 * absent jusqu'ici car inutile avant la mise à jour SDK 57 : Android dessinait le contenu sous la
 * barre de statut par défaut (edge-to-edge), les écrans SANS en-tête (donc sans le padding
 * automatique que React Navigation applique à ses en-têtes) n'avaient jamais besoin de gérer les
 * safe areas eux-mêmes. Depuis SDK 54, edge-to-edge est le comportement par défaut sur Android : le
 * contenu de ces écrans se retrouve dessiné SOUS la barre de statut, premier champ inclus (ni
 * visible ni cliquable), tant qu'ils ne compensent pas eux-mêmes avec les insets.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
