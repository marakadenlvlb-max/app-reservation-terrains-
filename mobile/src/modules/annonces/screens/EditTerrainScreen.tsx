import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionToken } from '@app/auth-core';
import { EQUIPEMENT_OPTIONS, useEditTerrainForm } from '@app/annonces-core';
import { SPORT_OPTIONS } from '@app/shared';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Modification et retrait d'une annonce — US-06. Équivalent mobile de EditTerrainForm (web),
 * même hook partagé (useEditTerrainForm).
 */
export function EditTerrainScreen({ terrainId }: { terrainId: string }) {
  // BUG-005 (rapport-qa.md, corrigé le 31 août 2026) : quatrième occurrence du même défaut que
  // BUG-002 — désormais éliminée à la racine via useSessionToken (packages/auth-core), qui
  // distingue "pas encore lu" (undefined) de "confirmé non connecté" (null) une fois pour toutes.
  const token = useSessionToken(mobileSessionStorage);
  const insets = useSafeAreaInsets();
  const [deleted, setDeleted] = useState(false);

  const {
    loading,
    loadError,
    sport,
    adresse,
    type,
    equipements,
    paliers,
    fraisAnnulationPourcentage,
    errors,
    saving,
    saveError,
    saved,
    deleting,
    deleteError,
    setSport,
    setAdresse,
    setType,
    toggleEquipement,
    addPalier,
    updatePalier,
    removePalier,
    setFraisAnnulationPourcentage,
    reinitialiserFraisAnnulation,
    save,
    remove,
  } = useEditTerrainForm({
    terrainId,
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
    onDeleted: () => setDeleted(true),
  });

  const confirmDelete = () => {
    // Alert.alert plutôt qu'un état local : retirer une annonce est irréversible, même logique
    // que window.confirm côté web (EditTerrainForm.tsx).
    Alert.alert('Retirer cette annonce ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => void remove() },
    ]);
  };

  if (deleted) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-sm text-green-600">Annonce retirée.</Text>
      </View>
    );
  }

  if (token === undefined || loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (loadError && !adresse) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {loadError}
        </Text>
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
      <Text className="text-xl font-semibold">Modifier l'annonce</Text>

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
        <Text className="text-sm font-medium">Frais de transaction sur remboursement</Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            accessibilityLabel="Frais de transaction sur remboursement"
            keyboardType="numeric"
            value={fraisAnnulationPourcentage}
            onChangeText={setFraisAnnulationPourcentage}
            className="rounded border border-gray-300 px-3 py-2"
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Revenir au taux par défaut" onPress={reinitialiserFraisAnnulation}>
            <Text className="text-sm text-blue-600">Revenir au taux par défaut</Text>
          </Pressable>
        </View>
      </View>

      {saveError && (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {saveError}
        </Text>
      )}
      {saved && <Text className="text-sm text-green-600">Annonce mise à jour.</Text>}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enregistrer"
        onPress={() => void save()}
        disabled={saving}
        className="items-center rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text className="font-medium text-white">Enregistrer</Text>}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retirer l'annonce"
        onPress={confirmDelete}
        disabled={deleting}
        className="items-center rounded border border-red-300 px-4 py-2 disabled:opacity-50"
      >
        <Text className="font-medium text-red-600">
          {deleting ? 'Retrait en cours…' : "Retirer l'annonce"}
        </Text>
      </Pressable>
      {deleteError && (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {deleteError}
        </Text>
      )}
    </View>
  );
}
