import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useMesTerrains, type Terrain } from '@app/annonces-core';
import { useSessionToken } from '@app/auth-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Liste des annonces du propriétaire/gestionnaire connecté — US-29 (module Navigation &
 * Interface globale, équivalent mobile d'US-27), destination de l'entrée de menu "Mes annonces".
 * Réutilise `useMesTerrains` (`@app/annonces-core`), déjà partagé et écrit pour US-27 côté web.
 */
export function MesAnnoncesScreen() {
  const token = useSessionToken(mobileSessionStorage);
  const { terrains, loading, error } = useMesTerrains({ apiBaseUrl: API_BASE_URL, token: token ?? null });

  if (token === undefined || loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error && terrains.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 px-6 pt-16">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-semibold">Mes annonces</Text>
        <Link href="/terrains/nouveau" className="text-sm text-blue-600">
          Publier une nouvelle annonce
        </Link>
      </View>

      {terrains.length === 0 ? (
        <Text className="text-sm text-gray-500">Tu n'as encore publié aucune annonce.</Text>
      ) : (
        <FlatList
          data={terrains}
          keyExtractor={(item: Terrain) => item.id}
          renderItem={({ item }) => (
            <View className="mb-2 rounded border border-gray-200 px-3 py-2">
              <Text className="font-medium">
                {item.adresse} — {item.sport}
              </Text>
              <View className="mt-1 flex-row gap-4">
                <Link href={`/terrains/${item.id}/modifier`} className="text-sm text-blue-600">
                  Modifier
                </Link>
                <Link href={`/terrains/${item.id}/creneaux`} className="text-sm text-blue-600">
                  Gérer les créneaux
                </Link>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
