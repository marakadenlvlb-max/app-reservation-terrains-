import { View } from 'react-native';
import { Link } from 'expo-router';
import { ProfileScreen } from '../../src/modules/authentification/screens/ProfileScreen';

// US-29 (module Navigation & Interface globale, équivalent mobile d'US-28) : Parrainage n'a pas
// sa propre entrée dans le tiroir (9 entrées verrouillées, comme côté web) — regroupé ici, sous
// Profil, plutôt que d'occuper une 10e entrée. Même décision que web/src/app/profil/page.tsx.
export default function ProfilRoute() {
  return (
    <View className="flex-1">
      <ProfileScreen />
      <Link href="/parrainage" className="px-6 pb-6 text-sm text-blue-600">
        Parrainer d'autres joueurs
      </Link>
    </View>
  );
}
