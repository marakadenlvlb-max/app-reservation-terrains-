import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useMesConversations, type ConversationApercu } from '@app/messagerie-core';
import { useSessionToken } from '@app/auth-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Liste des conversations de l'utilisateur connecté — US-29 (module Navigation & Interface
 * globale, équivalent mobile d'US-27), destination de l'entrée de menu "Messagerie". Réutilise
 * `useMesConversations` (`@app/messagerie-core`), déjà partagé et écrit pour US-27 côté web.
 */
export function MesConversationsScreen() {
  const token = useSessionToken(mobileSessionStorage);
  const { conversations, loading, error } = useMesConversations({
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

  if (error && conversations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {error}
        </Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-sm text-gray-500">Aucune conversation pour l'instant.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 px-6 pt-16">
      <Text className="mb-4 text-xl font-semibold">Messagerie</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item: ConversationApercu) => item.reservationId}
        renderItem={({ item }) => (
          <Link href={`/reservations/${item.reservationId}/messages`} asChild>
            <Pressable className="mb-2 rounded border border-gray-200 px-3 py-2">
              <Text className="font-medium">
                {item.terrain.adresse} — {item.terrain.sport}
              </Text>
              <Text className="text-sm text-gray-600">Avec {item.autrePartie.nom}</Text>
              {item.dernierMessage && (
                <Text className="text-sm text-gray-500" numberOfLines={1}>
                  {item.dernierMessage.contenu}
                </Text>
              )}
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}
