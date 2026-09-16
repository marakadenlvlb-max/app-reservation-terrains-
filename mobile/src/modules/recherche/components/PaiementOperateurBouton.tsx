import { useState } from 'react';
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
  const { initiating, initiateError, montantFacture, reductionParrainagePourcentage, initier } = useInitierPaiement({
    apiBaseUrl: API_BASE_URL,
    token,
  });
  // BUG-006 (rapport-qa.md, corrigé le 1 septembre 2026) : `WebBrowser.openBrowserAsync` était
  // `await`é sans jamais être entouré d'un `try/catch` — s'il rejette (URL que l'app ne sait pas
  // ouvrir, par exemple), la rejection n'était jamais rattrapée et l'utilisateur ne voyait aucun
  // message, alors que le paiement est resté "initié" côté backend. `openError` est un état
  // séparé de `initiateError` : ce n'est pas l'initiation qui a échoué, c'est l'ouverture, une
  // fois l'URL déjà obtenue avec succès.
  const [openError, setOpenError] = useState<string | null>(null);

  const handlePress = async () => {
    setOpenError(null);
    const url = await initier(reservationId, operateur);
    if (url) {
      try {
        await WebBrowser.openBrowserAsync(url);
      } catch {
        setOpenError("Le paiement n'a pas pu s'ouvrir. Réessaie.");
      }
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
      {/* Transparence de la réduction de parrainage (rapport-qa.md, 9 septembre 2026) : sans ce
          message, un parrain payait moins cher sans jamais pouvoir le constater dans l'app. */}
      {reductionParrainagePourcentage !== null && montantFacture !== null && (
        <Text className="text-sm text-green-700">
          Réduction de parrainage de {reductionParrainagePourcentage}% appliquée — montant facturé : {montantFacture} FCFA.
        </Text>
      )}
      {openError && (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {openError}
        </Text>
      )}
    </View>
  );
}
