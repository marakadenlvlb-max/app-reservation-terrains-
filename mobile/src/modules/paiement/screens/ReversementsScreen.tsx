import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { OPERATEUR_LABELS, useReversements, type Reversement } from '@app/paiement-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  effectue: 'Effectué',
};

/**
 * Liste des reversements du propriétaire/gestionnaire — US-15 / RF-015. Équivalent mobile de
 * ReversementsList (web), même hook partagé (useReversements). Lecture seule, comme côté web.
 */
export function ReversementsScreen() {
  // `undefined` = pas encore lu depuis le stockage local ; `null` = lu, mais pas connecté — voir
  // le même commentaire dans ReversementsList.tsx (web) pour le piège que ça évite.
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    mobileSessionStorage.getToken().then(setToken);
  }, []);

  const { reversements, loading, error } = useReversements({ apiBaseUrl: API_BASE_URL, token: token ?? null });

  if (token === undefined || loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error && reversements.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {error}
        </Text>
      </View>
    );
  }

  if (reversements.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-sm text-gray-500">Aucun reversement pour l'instant.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 px-6 pt-16">
      <Text className="mb-4 text-xl font-semibold">Mes reversements</Text>
      <FlatList
        data={reversements}
        keyExtractor={(item: Reversement) => item.paiementId}
        renderItem={({ item }) => (
          <View className="mb-2 rounded border border-gray-200 px-3 py-2">
            <Text className="font-medium">
              {OPERATEUR_LABELS[item.operateur]} — {STATUT_LABELS[item.statutReversement] ?? item.statutReversement}
            </Text>
            <Text className="text-sm text-gray-600">
              Brut {item.montant} — Commission {item.commission} — Net {item.montantNet}
            </Text>
            <Text className="text-sm text-gray-500">{(item.dateReversement ?? item.datePaiement)}</Text>
          </View>
        )}
      />
    </View>
  );
}
