import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { useTerrainDetail } from '@app/recherche-core';
import { EQUIPEMENT_OPTIONS } from '@app/shared';
import { ReserverCreneauBouton } from '../components/ReserverCreneauBouton';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const EQUIPEMENT_LABELS = Object.fromEntries(EQUIPEMENT_OPTIONS.map((option) => [option.value, option.label]));

/**
 * Détail d'une annonce — US-08 / RF-009. Équivalent mobile de TerrainDetailView (web), même hook
 * partagé (useTerrainDetail). `terrainId` en prop faute de routeur en place, comme les autres
 * écrans du module Annonces (voir leurs mêmes TODOs "routing").
 */
export function TerrainDetailScreen({ terrainId }: { terrainId: string }) {
  const { detail, loading, error } = useTerrainDetail({ terrainId, apiBaseUrl: API_BASE_URL });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {error ?? "Cette annonce n'existe pas ou n'est plus disponible."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-6 pt-16" contentContainerClassName="gap-4 pb-12">
      {detail.photos.length > 0 && (
        <ScrollView horizontal className="flex-row gap-2">
          {detail.photos.map((url) => (
            <Image key={url} source={{ uri: url }} className="mr-2 h-40 w-40 rounded" />
          ))}
        </ScrollView>
      )}

      <View>
        <Text className="text-xl font-semibold">
          {detail.adresse} — {detail.sport}
        </Text>
        {detail.type && <Text className="text-sm text-gray-600">{detail.type}</Text>}
        <Text className="text-sm text-gray-600">
          Note moyenne du propriétaire/gestionnaire :{' '}
          {detail.proprietaireNoteMoyenne !== null ? `${detail.proprietaireNoteMoyenne.toFixed(1)} / 5` : 'Pas encore de note'}
        </Text>
      </View>

      {detail.equipements.length > 0 && (
        <View>
          <Text className="text-sm font-medium">Équipements</Text>
          <View className="flex-row gap-2">
            {detail.equipements.map((equipement) => (
              <Text key={equipement} className="text-sm text-gray-600">
                {EQUIPEMENT_LABELS[equipement] ?? equipement}
              </Text>
            ))}
          </View>
        </View>
      )}

      <View>
        <Text className="text-sm font-medium">Créneaux disponibles</Text>
        {detail.creneauxDisponibles.length === 0 ? (
          <Text className="text-sm text-gray-500">Aucun créneau disponible pour l'instant.</Text>
        ) : (
          detail.creneauxDisponibles.map((creneau) => (
            <View key={creneau.id} className="mt-2 gap-2 rounded border border-gray-200 px-3 py-2">
              <Text className="text-sm">
                {creneau.debut} → {creneau.fin} — {creneau.tarif}
              </Text>
              <ReserverCreneauBouton creneauId={creneau.id} />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
