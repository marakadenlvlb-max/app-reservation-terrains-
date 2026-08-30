import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { EQUIPEMENT_OPTIONS, useEditTerrainForm } from '@app/annonces-core';
import { SPORT_OPTIONS } from '@app/shared';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Modification et retrait d'une annonce — US-06. Équivalent mobile de EditTerrainForm (web),
 * même hook partagé (useEditTerrainForm).
 */
export function EditTerrainScreen({ terrainId }: { terrainId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    mobileSessionStorage.getToken().then(setToken);
  }, []);

  const {
    loading,
    loadError,
    sport,
    adresse,
    type,
    equipements,
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
    save,
    remove,
  } = useEditTerrainForm({
    terrainId,
    apiBaseUrl: API_BASE_URL,
    token,
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

  if (loading) {
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
    <View className="flex-1 justify-center gap-4 px-6">
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
