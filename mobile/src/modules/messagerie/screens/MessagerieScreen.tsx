import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useMessages, type Message } from '@app/messagerie-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Conversation liée à une réservation — US-24 / RF-023. Équivalent mobile de MessagerieView
 * (web), même hook partagé (useMessages). `reservationId` reçu en prop faute de routeur en
 * place, comme les autres écrans qui en dépendent (voir NotationScreen).
 */
export function MessagerieScreen({ reservationId }: { reservationId: string }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [texte, setTexte] = useState('');

  useEffect(() => {
    mobileSessionStorage.getToken().then(setToken);
  }, []);

  const { messages, loading, error, sending, sendError, envoyer } = useMessages({
    reservationId,
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

  if (error && messages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {error}
        </Text>
      </View>
    );
  }

  const handleEnvoyer = () => {
    // Vidage immédiat plutôt qu'après résolution de l'envoi (même choix que MessagerieView web).
    const contenu = texte;
    setTexte('');
    void envoyer(contenu);
  };

  return (
    <View className="flex-1 px-6 pt-16">
      <Text className="mb-4 text-xl font-semibold">Messages</Text>

      {messages.length === 0 ? (
        <Text className="text-sm text-gray-500">Aucun message pour l'instant. Pose ta question ci-dessous.</Text>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item: Message) => item.id}
          renderItem={({ item }) => (
            <View
              className={`mb-2 max-w-[80%] rounded px-3 py-2 ${
                item.estDeMoi ? 'self-end bg-blue-600' : 'self-start bg-gray-100'
              }`}
            >
              <Text className={item.estDeMoi ? 'text-white' : 'text-gray-900'}>{item.contenu}</Text>
            </View>
          )}
        />
      )}

      <View className="mt-4 flex-row gap-2">
        <TextInput
          accessibilityLabel="Message"
          value={texte}
          onChangeText={setTexte}
          placeholder="Écris ton message…"
          className="flex-1 rounded border border-gray-300 px-3 py-2"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Envoyer"
          onPress={handleEnvoyer}
          disabled={sending || !texte.trim()}
          className="items-center justify-center rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
        >
          <Text className="text-sm font-medium text-white">{sending ? 'Envoi…' : 'Envoyer'}</Text>
        </Pressable>
      </View>
      {sendError && (
        <Text accessibilityRole="alert" className="mt-2 text-sm text-red-600">
          {sendError}
        </Text>
      )}
    </View>
  );
}
