import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useRecommandations, type TerrainRecommande } from '@app/recherche-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Recommandations de terrains basées sur l'historique du joueur — US-25 / RF-024. Équivalent
 * mobile de RecommandationsList (web), même hook partagé (useRecommandations).
 */
export function RecommandationsScreen() {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    mobileSessionStorage.getToken().then(setToken);
  }, []);

  const { recommandations, loading, error } = useRecommandations({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  if (token === undefined || loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error && recommandations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {error}
        </Text>
      </View>
    );
  }

  if (recommandations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-sm text-gray-500">
          Pas encore de recommandation — réserve un premier créneau pour en recevoir.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 px-6 pt-16">
      <Text className="mb-4 text-xl font-semibold">Recommandé pour toi</Text>
      <FlatList
        data={recommandations}
        keyExtractor={(item: TerrainRecommande) => item.terrainId}
        renderItem={({ item }) => (
          <Link href={`/terrains/${item.terrainId}`} asChild>
            <Pressable className="mb-2 rounded border border-gray-200 px-3 py-2">
              <Text className="font-medium">
                {item.adresse} — {item.sport}
              </Text>
              <Text>À partir de {item.tarifMin}</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}
