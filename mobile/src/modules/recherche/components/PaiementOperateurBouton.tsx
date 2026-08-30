import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { OPERATEUR_LABELS, useInitierPaiement, type Operateur } from '@app/paiement-core';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Bouton de paiement pour un opérateur donné — US-12 / RF-011 (Wave pour l'instant ; Orange
 * Money et Moov Money suivront à l'identique, US-13/US-14). Équivalent mobile de
 * PaiementOperateurBouton (web) : `expo-web-browser` ouvre un navigateur intégré
 * (SFSafariViewController/Custom Tab) plutôt qu'un navigateur externe (`Linking.openURL`) — RF-011
 * précise "sans sortir de l'application", et un navigateur externe romprait davantage cette
 * continuité qu'une vue intégrée qui reste au-dessus de l'app.
 */
export function PaiementOperateurBouton({
  reservationId,
  operateur,
  token,
}: {
  reservationId: string;
  operateur: Operateur;
  token: string;
}) {
  const { initiating, initiateError, initier } = useInitierPaiement({ apiBaseUrl: API_BASE_URL, token });

  const handlePress = async () => {
    const url = await initier(reservationId, operateur);
    if (url) {
      await WebBrowser.openBrowserAsync(url);
    }
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Payer avec ${OPERATEUR_LABELS[operateur]}`}
        onPress={() => void handlePress()}
        disabled={initiating}
        className="self-start rounded border border-blue-600 px-3 py-1 disabled:opacity-50"
      >
        {initiating ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-sm font-medium text-blue-600">Payer avec {OPERATEUR_LABELS[operateur]}</Text>
        )}
      </Pressable>
      {initiateError && (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {initiateError}
        </Text>
      )}
    </View>
  );
}
