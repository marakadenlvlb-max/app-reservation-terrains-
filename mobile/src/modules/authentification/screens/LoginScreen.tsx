import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useLoginForm } from '@app/auth-core';
import { mobileSessionStorage } from '../sessionStorage';

/**
 * Écran de connexion — US-02 / RF-002. Équivalent mobile de LoginForm (web) : même hook partagé
 * (@app/auth-core/useLoginForm), seule l'implémentation du stockage de session diffère
 * (expo-secure-store au lieu de localStorage).
 */
export function LoginScreen() {
  const { identifiant, motDePasse, errors, submitting, submitError, setIdentifiant, setMotDePasse, submit } =
    useLoginForm({
      apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
      sessionStorage: mobileSessionStorage,
      onSuccess: () => {
        // TODO: naviguer vers le tableau de bord une fois le routing de l'app mobile défini.
      },
    });

  return (
    <View className="flex-1 justify-center gap-4 px-6">
      <Text className="text-xl font-semibold">Se connecter</Text>

      <View className="gap-1">
        <Text className="text-sm font-medium">Email ou téléphone</Text>
        <TextInput
          accessibilityLabel="Email ou téléphone"
          value={identifiant}
          onChangeText={setIdentifiant}
          autoCapitalize="none"
          className="rounded border border-gray-300 px-3 py-2"
        />
        {errors.identifiant && <Text className="text-sm text-red-600">{errors.identifiant}</Text>}
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium">Mot de passe</Text>
        <TextInput
          accessibilityLabel="Mot de passe"
          value={motDePasse}
          onChangeText={setMotDePasse}
          secureTextEntry
          className="rounded border border-gray-300 px-3 py-2"
        />
        {errors.motDePasse && <Text className="text-sm text-red-600">{errors.motDePasse}</Text>}
      </View>

      {submitError && (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {submitError}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Se connecter"
        onPress={() => void submit()}
        disabled={submitting}
        className="items-center rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text className="font-medium text-white">Se connecter</Text>}
      </Pressable>
    </View>
  );
}
