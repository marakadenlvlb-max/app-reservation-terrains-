import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useNotifications, type Notification } from '@app/notification-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';
import { usePushRegistration } from '../hooks/usePushRegistration';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const TYPE_LABELS: Record<string, string> = {
  confirmation_reservation: 'Réservation confirmée',
  rappel_creneau: 'Rappel de créneau',
};

/**
 * Journal des notifications — US-20/US-21, module Notifications (RF-020). Équivalent mobile de
 * NotificationsList (web), même hook partagé (useNotifications) ; câble en plus
 * usePushRegistration pour que l'appareil puisse recevoir les prochains pushes (voir ses TODOs
 * pour la limite actuelle : enregistrement déclenché en visitant cet écran, pas globalement à la
 * connexion, faute de routeur applicatif en place).
 */
export function NotificationsScreen() {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    mobileSessionStorage.getToken().then(setToken);
  }, []);

  const { notifications, loading, error, markingId, markAsRead } = useNotifications({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  const { registerError } = usePushRegistration({ apiBaseUrl: API_BASE_URL, token: token ?? null });

  // Signalé en QA (rapport-qa.md) : `registerError` était auparavant ignoré — un échec
  // d'enregistrement du jeton push restait invisible, alors même que c'est le seul canal qui
  // permet à un rappel (US-21) d'atteindre l'utilisateur hors de l'application. Affiché comme un
  // avertissement non bloquant plutôt qu'un rôle "alert" : le journal in-app (US-20) reste
  // consultable normalement, ce n'est pas une erreur qui empêche l'écran de fonctionner.
  const avertissementPush = registerError ? (
    <Text className="mb-2 text-xs text-orange-600">
      Impossible d'activer les notifications push sur cet appareil : {registerError}
    </Text>
  ) : null;

  if (token === undefined || loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        {avertissementPush}
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {error}
        </Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        {avertissementPush}
        <Text className="text-sm text-gray-500">Aucune notification pour l'instant.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 px-6 pt-16">
      <Text className="mb-4 text-xl font-semibold">Mes notifications</Text>
      {avertissementPush}
      <FlatList
        data={notifications}
        keyExtractor={(item: Notification) => item.id}
        renderItem={({ item }) => (
          <View
            className={`mb-2 rounded border px-3 py-2 ${
              item.lue ? 'border-gray-200' : 'border-blue-400 bg-blue-50'
            }`}
          >
            <Text className="font-medium">{TYPE_LABELS[item.type] ?? item.titre}</Text>
            <Text className="text-gray-700">{item.message}</Text>
            <Text className="text-xs text-gray-500">{item.createdAt}</Text>
            {!item.lue && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Marquer comme lue : ${item.titre}`}
                onPress={() => void markAsRead(item.id)}
                disabled={markingId === item.id}
                className="mt-1 self-start"
              >
                <Text className="text-xs text-blue-600">
                  {markingId === item.id ? 'Marquage…' : 'Marquer comme lue'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}
