import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SPORT_OPTIONS, useProfileForm, usePhotoUpload } from '@app/auth-core';
import { mobileSessionStorage } from '../sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Écran d'édition du profil — US-03 / RF-003. Équivalent mobile de ProfileForm (web) : même
 * logique partagée (useProfileForm, usePhotoUpload), seules la capture de la photo
 * (expo-image-picker plutôt qu'un input file) et le stockage de session diffèrent.
 */
export function ProfileScreen() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    mobileSessionStorage.getToken().then(setToken);
  }, []);

  const {
    loading,
    loadError,
    nom,
    ville,
    sports,
    photoUrl,
    errors,
    saving,
    saveError,
    saved,
    setNom,
    setVille,
    toggleSport,
    setPhotoUrl,
    save,
  } = useProfileForm({ apiBaseUrl: API_BASE_URL, token });

  const { uploading, error: photoError, upload } = usePhotoUpload({
    apiBaseUrl: API_BASE_URL,
    token,
    onUploaded: setPhotoUrl,
  });

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const formData = new FormData();
    // React Native ne connaît pas l'objet File du navigateur : on passe un objet
    // { uri, name, type }, que le runtime natif convertit en partie multipart.
    formData.append('photo', {
      uri: asset.uri,
      name: asset.fileName ?? 'photo.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    } as unknown as Blob);
    void upload(formData);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (loadError && !nom) {
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
      <Text className="text-xl font-semibold">Mon profil</Text>

      <View className="items-start gap-2">
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} className="h-20 w-20 rounded-full" />
        ) : (
          <View className="h-20 w-20 rounded-full bg-gray-200" />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Changer la photo de profil"
          onPress={pickPhoto}
          disabled={uploading}
        >
          <Text className="text-sm text-blue-600">{uploading ? 'Envoi…' : 'Changer la photo'}</Text>
        </Pressable>
        {photoError && (
          <Text accessibilityRole="alert" className="text-sm text-red-600">
            {photoError}
          </Text>
        )}
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium">Nom</Text>
        <TextInput
          accessibilityLabel="Nom"
          value={nom}
          onChangeText={setNom}
          className="rounded border border-gray-300 px-3 py-2"
        />
        {errors.nom && <Text className="text-sm text-red-600">{errors.nom}</Text>}
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium">Ville</Text>
        <TextInput
          accessibilityLabel="Ville"
          value={ville}
          onChangeText={setVille}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium">Sport(s) pratiqué(s)</Text>
        <View className="flex-row gap-4">
          {SPORT_OPTIONS.map((sport) => {
            const selected = sports.includes(sport.value);
            return (
              <Pressable
                key={sport.value}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={sport.label}
                onPress={() => toggleSport(sport.value)}
                className={`rounded border px-3 py-1 ${
                  selected ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <Text>{sport.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {errors.sports && <Text className="text-sm text-red-600">{errors.sports}</Text>}
      </View>

      {saveError && (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {saveError}
        </Text>
      )}
      {saved && <Text className="text-sm text-green-600">Profil mis à jour.</Text>}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enregistrer"
        onPress={() => void save()}
        disabled={saving}
        className="items-center rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text className="font-medium text-white">Enregistrer</Text>}
      </Pressable>
    </View>
  );
}
