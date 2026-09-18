import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NOTE_MAX, NOTE_MIN, useNoterSession } from '@app/notation-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';
import { NoteMoyenneBadge } from '../components/NoteMoyenneBadge';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const NOTES = Array.from({ length: NOTE_MAX - NOTE_MIN + 1 }, (_, i) => NOTE_MIN + i);

/**
 * Écran de notation d'une session — US-16 / RF-016. Équivalent mobile de NotationForm (web),
 * même hook partagé (useNoterSession). `reservationId`/`cibleId` en props, même limite que
 * ReserverCreneauBouton avant US-08 (pas encore d'écran "historique" pour y naviguer).
 */
export function NotationScreen({ reservationId, cibleId }: { reservationId: string; cibleId: string }) {
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    mobileSessionStorage.getToken().then(setToken);
  }, []);

  const { note, commentaire, submitting, submitError, submitted, setNote, setCommentaire, submit } =
    useNoterSession({ apiBaseUrl: API_BASE_URL, token: token ?? null });

  if (token === undefined) {
    return null;
  }

  if (token === null) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-sm text-blue-600">Connecte-toi pour laisser une note.</Text>
      </View>
    );
  }

  if (submitted) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-sm text-green-600">Merci, ta note a bien été enregistrée.</Text>
      </View>
    );
  }

  return (
    // Écran hors du groupe (drawer), donc sans en-tête : voir le commentaire équivalent dans
    // LoginScreen.tsx (régression edge-to-edge Android, SDK 57).
    <View
      className="flex-1 justify-center gap-4 px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View>
        <Text className="text-xl font-semibold">Noter cette session</Text>
        <View className="flex-row gap-1">
          <Text className="text-sm text-gray-600">Note actuelle de cette personne :</Text>
          <NoteMoyenneBadge utilisateurId={cibleId} />
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium">Note</Text>
        <View className="flex-row gap-2">
          {NOTES.map((value) => {
            const selected = note === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={String(value)}
                onPress={() => setNote(value)}
                className={`rounded border px-3 py-1 ${selected ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              >
                <Text>{value}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium">Commentaire (optionnel)</Text>
        <TextInput
          accessibilityLabel="Commentaire"
          value={commentaire}
          onChangeText={setCommentaire}
          multiline
          numberOfLines={3}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </View>

      {submitError && (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {submitError}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Envoyer ma note"
        onPress={() => void submit(reservationId, cibleId)}
        disabled={submitting}
        className="self-start rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
      >
        <Text className="text-sm font-medium text-white">{submitting ? 'Envoi…' : 'Envoyer ma note'}</Text>
      </Pressable>
    </View>
  );
}
