import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { SPORT_OPTIONS, useRegisterForm } from '@app/auth-core';

/**
 * Écran d'inscription joueur — US-01 / RF-001 (module Authentification & Profils).
 * Équivalent mobile de RegisterForm (web) : même hook partagé (@app/auth-core/useRegisterForm)
 * pour la validation et l'appel API, seule l'UI change entre les deux plateformes.
 */
export function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    identifiant,
    motDePasse,
    sports,
    errors,
    submitting,
    submitError,
    setIdentifiant,
    setMotDePasse,
    toggleSport,
    submit,
  } = useRegisterForm({
    apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
    onSuccess: () => {
      // US-29 referme ce TODO, mais PAS vers /accueil (même raison qu'US-27/RegisterForm côté
      // web) : `RegisterResult` (packages/auth-core/src/types.ts, partagé) ne renvoie aucun
      // token — l'inscription seule ne crée pas de session. On redirige donc vers /connexion.
      router.push('/connexion');
    },
  });

  return (
    // Écran hors du groupe (drawer), donc sans en-tête : voir le commentaire équivalent dans
    // LoginScreen.tsx (régression edge-to-edge Android, SDK 57).
    <View
      className="flex-1 justify-center gap-4 px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Text className="text-xl font-semibold">Créer un compte</Text>

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

      {submitError && (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {submitError}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Créer mon compte"
        onPress={() => void submit()}
        disabled={submitting}
        className="items-center rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-medium text-white">Créer mon compte</Text>
        )}
      </Pressable>

      {/* US-29 : /connexion n'était atteignable depuis ici que via App.tsx codé en dur. */}
      <Link href="/connexion" className="text-sm text-blue-600">
        Déjà un compte ? Se connecter
      </Link>
    </View>
  );
}
