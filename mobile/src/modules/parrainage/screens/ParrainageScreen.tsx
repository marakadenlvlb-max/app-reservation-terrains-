import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useParrainage, type Filleul } from '@app/parrainage-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  valide: 'Avantage accordé',
};

/**
 * Parrainage — US-26 / RF-025. Équivalent mobile de ParrainageView (web), même hook partagé
 * (useParrainage).
 */
export function ParrainageScreen() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [code, setCode] = useState('');

  useEffect(() => {
    mobileSessionStorage.getToken().then(setToken);
  }, []);

  const { resume, loading, error, submitting, submitError, submitted, utiliserCode } = useParrainage({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  // Vide le champ une fois le code accepté, pas avant — voir le même choix dans ParrainageView (web).
  useEffect(() => {
    if (submitted) setCode('');
  }, [submitted]);

  if (token === undefined || loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error && !resume) {
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
      <Text className="mb-1 text-xl font-semibold">Parrainage</Text>
      {resume && (
        <Text className="mb-4 text-sm text-gray-700">
          Ton code à partager : <Text className="font-semibold">{resume.codeParrainage}</Text>
        </Text>
      )}

      <Text className="mb-1 text-sm font-medium">Tes filleuls</Text>
      {!resume || resume.filleuls.length === 0 ? (
        <Text className="mb-4 text-sm text-gray-500">Tu n'as encore parrainé personne.</Text>
      ) : (
        <FlatList
          data={resume.filleuls}
          keyExtractor={(item: Filleul) => item.id}
          renderItem={({ item }) => (
            <View className="mb-2 rounded border border-gray-200 px-3 py-2">
              <Text className="font-medium">{item.nom}</Text>
              <Text className="text-gray-600">
                {STATUT_LABELS[item.statut] ?? item.statut}
                {item.avantage ? ` — ${item.avantage}` : ''}
              </Text>
            </View>
          )}
        />
      )}

      <Text className="mb-1 mt-4 text-sm font-medium">Tu as reçu un code de parrainage ?</Text>
      <View className="flex-row gap-2">
        <TextInput
          accessibilityLabel="Code de parrainage"
          value={code}
          onChangeText={setCode}
          placeholder="ex. AWA1234"
          autoCapitalize="characters"
          className="flex-1 rounded border border-gray-300 px-3 py-2"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Utiliser"
          onPress={() => void utiliserCode(code)}
          disabled={submitting || !code.trim()}
          className="items-center justify-center rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
        >
          <Text className="text-sm font-medium text-white">{submitting ? 'Envoi…' : 'Utiliser'}</Text>
        </Pressable>
      </View>
      {submitError && (
        <Text accessibilityRole="alert" className="mt-2 text-sm text-red-600">
          {submitError}
        </Text>
      )}
      {submitted && <Text className="mt-2 text-sm text-green-700">Code accepté !</Text>}
    </View>
  );
}
