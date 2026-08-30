import { Text } from 'react-native';
import { useNoteMoyenne } from '@app/notation-core';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Badge de note moyenne — US-17 / RF-017. Équivalent mobile de NoteMoyenneBadge (web), même hook
 * partagé (useNoteMoyenne).
 */
export function NoteMoyenneBadge({ utilisateurId }: { utilisateurId: string }) {
  const { noteMoyenne, loading, error } = useNoteMoyenne({ utilisateurId, apiBaseUrl: API_BASE_URL });

  if (loading) {
    return <Text className="text-sm text-gray-400">Note…</Text>;
  }

  if (error || !noteMoyenne || noteMoyenne.moyenne === null) {
    return <Text className="text-sm text-gray-500">Pas encore de note</Text>;
  }

  return (
    <Text className="text-sm text-gray-700">
      ★ {noteMoyenne.moyenne.toFixed(1)} / 5 ({noteMoyenne.nombreAvis} avis)
    </Text>
  );
}
