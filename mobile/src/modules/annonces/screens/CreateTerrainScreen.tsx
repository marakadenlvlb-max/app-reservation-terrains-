import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useSessionToken } from '@app/auth-core';
import { EQUIPEMENT_OPTIONS, useCreateTerrainForm, useTerrainPhotoUpload, type Terrain } from '@app/annonces-core';
import { SPORT_OPTIONS } from '@app/shared';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Écran de publication d'annonce — US-04 / RF-004 (module Annonces & Créneaux). Équivalent
 * mobile de CreateTerrainForm (web) : même logique partagée (useCreateTerrainForm,
 * useTerrainPhotoUpload), seules la capture de la photo (expo-image-picker) et le stockage de
 * session diffèrent.
 */
export function CreateTerrainScreen() {
  // BUG-003 (rapport-qa.md, corrigé le 31 août 2026) : useSessionToken distingue "pas encore lu"
  // (undefined) de "confirmé non connecté" (null) — élimine à la racine le risque qu'un
  // utilisateur bien connecté se fasse rejeter par submit() s'il soumet très vite après le
  // montage. L'écran reste volontairement saisissable avant résolution ; seul le bouton de
  // soumission est désactivé le temps de savoir si `token` est réellement `null` ou une vraie
  // session — voir plus bas.
  const token = useSessionToken(mobileSessionStorage);
  const insets = useSafeAreaInsets();
  const [terrain, setTerrain] = useState<Terrain | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const {
    sport,
    adresse,
    type,
    equipements,
    paliers,
    fraisAnnulationPourcentage,
    errors,
    submitting,
    submitError,
    setSport,
    setAdresse,
    setType,
    toggleEquipement,
    addPalier,
    updatePalier,
    removePalier,
    setFraisAnnulationPourcentage,
    submit,
  } = useCreateTerrainForm({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
    onSuccess: setTerrain,
  });

  const { uploading, error: photoError, upload } = useTerrainPhotoUpload({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
    onUploaded: (url) => setPhotoUrls((current) => [...current, url]),
  });

  const pickPhoto = async () => {
    if (!terrain) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('photo', {
      uri: asset.uri,
      name: asset.fileName ?? 'photo.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    } as unknown as Blob);
    void upload(terrain.id, formData);
  };

  if (terrain) {
    return (
      // Écran hors du groupe (drawer), donc sans en-tête : voir le commentaire équivalent dans
      // LoginScreen.tsx (régression edge-to-edge Android, SDK 57).
      <View
        className="flex-1 justify-center gap-4 px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Text className="text-sm text-green-600">
          Annonce publiée. Ajoute des photos pour la rendre plus attractive.
        </Text>

        <ScrollView horizontal className="flex-row gap-2">
          {photoUrls.map((url) => (
            <Image key={url} source={{ uri: url }} className="mr-2 h-20 w-20 rounded" />
          ))}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter une photo"
          onPress={pickPhoto}
          disabled={uploading}
        >
          <Text className="text-sm text-blue-600">{uploading ? 'Envoi…' : 'Ajouter une photo'}</Text>
        </Pressable>
        {photoError && (
          <Text accessibilityRole="alert" className="text-sm text-red-600">
            {photoError}
          </Text>
        )}
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
      <Text className="text-xl font-semibold">Publier une annonce</Text>

      <View className="gap-1">
        <Text className="text-sm font-medium">Sport</Text>
        <View className="flex-row gap-4">
          {SPORT_OPTIONS.map((option) => {
            const selected = sport === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={option.label}
                onPress={() => setSport(option.value)}
                className={`rounded border px-3 py-1 ${
                  selected ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <Text>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {errors.sport && <Text className="text-sm text-red-600">{errors.sport}</Text>}
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium">Adresse</Text>
        <TextInput
          accessibilityLabel="Adresse"
          value={adresse}
          onChangeText={setAdresse}
          className="rounded border border-gray-300 px-3 py-2"
        />
        {errors.adresse && <Text className="text-sm text-red-600">{errors.adresse}</Text>}
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium">Type de terrain (optionnel)</Text>
        <TextInput
          accessibilityLabel="Type de terrain"
          value={type}
          onChangeText={setType}
          placeholder="ex. synthétique extérieur"
          className="rounded border border-gray-300 px-3 py-2"
        />
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium">Équipements (optionnel)</Text>
        <View className="flex-row gap-4">
          {EQUIPEMENT_OPTIONS.map((option) => {
            const selected = equipements.includes(option.value);
            return (
              <Pressable
                key={option.value}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={option.label}
                onPress={() => toggleEquipement(option.value)}
                className={`rounded border px-3 py-1 ${
                  selected ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <Text>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium">Politique d'annulation</Text>
        <Text className="text-xs text-gray-500">
          Au moins un palier requis : délai minimum avant le créneau (en minutes) et pourcentage remboursé si le
          joueur annule à ce délai ou plus.
        </Text>
        {paliers.map((palier, index) => (
          <View key={index} className="flex-row items-center gap-2">
            <TextInput
              accessibilityLabel={`Délai en minutes du palier ${index + 1}`}
              keyboardType="numeric"
              value={String(palier.delaiMinutes)}
              onChangeText={(value) => updatePalier(index, { ...palier, delaiMinutes: Number(value) || 0 })}
              className="w-20 rounded border border-gray-300 px-2 py-1"
            />
            <Text className="text-sm">min avant →</Text>
            <TextInput
              accessibilityLabel={`Pourcentage remboursé du palier ${index + 1}`}
              keyboardType="numeric"
              value={String(palier.pourcentageRemboursement)}
              onChangeText={(value) =>
                updatePalier(index, { ...palier, pourcentageRemboursement: Number(value) || 0 })
              }
              className="w-16 rounded border border-gray-300 px-2 py-1"
            />
            <Text className="text-sm">%</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Retirer le palier ${index + 1}`} onPress={() => removePalier(index)}>
              <Text className="text-sm text-red-600">Retirer</Text>
            </Pressable>
          </View>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Ajouter un palier" onPress={addPalier}>
          <Text className="text-sm text-blue-600">+ Ajouter un palier</Text>
        </Pressable>
        {errors.paliers && <Text className="text-sm text-red-600">{errors.paliers}</Text>}
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium">Frais de transaction sur remboursement (optionnel)</Text>
        <TextInput
          accessibilityLabel="Frais de transaction sur remboursement"
          keyboardType="numeric"
          value={fraisAnnulationPourcentage}
          onChangeText={setFraisAnnulationPourcentage}
          placeholder="Laisse vide pour un taux par défaut selon ton nombre de terrains"
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
        accessibilityLabel="Publier l'annonce"
        onPress={() => void submit()}
        disabled={submitting || token === undefined}
        className="items-center rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-medium text-white">Publier l'annonce</Text>
        )}
      </Pressable>
    </View>
  );
}
