import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useCountdown, useReservationStatus, useReserverCreneau, type Reservation } from '@app/reservation-core';
import { OPERATEURS } from '@app/paiement-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';
import { PaiementOperateurBouton } from './PaiementOperateurBouton';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Bouton de réservation d'un créneau — US-10 / RF-010. Équivalent mobile de
 * ReserverCreneauBouton (web), mêmes hooks partagés.
 */
export function ReserverCreneauBouton({ creneauId }: { creneauId: string }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    mobileSessionStorage.getToken().then(setToken);
  }, []);

  const { reservation, reserving, reserveError, reserver } = useReserverCreneau({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  if (token === undefined) {
    return null;
  }

  if (token === null) {
    return (
      <Link href="/connexion" className="text-sm text-blue-600">
        Connecte-toi pour réserver
      </Link>
    );
  }

  if (reservation) {
    return <ReservationStatusPanel initial={reservation} apiBaseUrl={API_BASE_URL} token={token} />;
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Réserver"
        onPress={() => void reserver(creneauId)}
        disabled={reserving}
        className="self-start rounded bg-blue-600 px-3 py-1 disabled:opacity-50"
      >
        {reserving ? <ActivityIndicator color="#fff" /> : <Text className="text-sm font-medium text-white">Réserver</Text>}
      </Pressable>
      {reserveError && (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {reserveError}
        </Text>
      )}
    </View>
  );
}

/**
 * Affiche l'état d'une réservation en cours et se met à jour via polling — US-11 / RF-014. Même
 * logique que ReservationStatusPanel côté web.
 */
function ReservationStatusPanel({
  initial,
  apiBaseUrl,
  token,
}: {
  initial: Reservation;
  apiBaseUrl: string;
  token: string;
}) {
  const { reservation: polled, error: pollError } = useReservationStatus({
    reservationId: initial.id,
    expireA: initial.expireA,
    apiBaseUrl,
    token,
  });
  const reservation = polled ?? initial;
  const { remainingSeconds, expired } = useCountdown(reservation.expireA);

  if (reservation.statut === 'confirmee') {
    return <Text className="text-sm text-green-600">✅ Réservation confirmée !</Text>;
  }

  if (reservation.statut === 'annulee') {
    return (
      <Text className="text-sm text-red-600">
        La réservation a été annulée — ce créneau est de nouveau disponible.
      </Text>
    );
  }

  if (expired) {
    return <Text className="text-sm text-red-600">Le délai a expiré, ce créneau est redevenu disponible.</Text>;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  return (
    <View>
      <Text className="text-sm text-green-600">
        Créneau verrouillé — il te reste {minutes}:{seconds} pour finaliser le paiement.
      </Text>
      <Text className="text-sm text-gray-600">Choisis ton moyen de paiement :</Text>
      <View className="flex-row flex-wrap gap-2">
        {/* Un seul composant générique pour les trois opérateurs (US-12 à US-14) — voir
            PaiementOperateurBouton et l'adaptateur de paiement commun décrit dans architecture.md. */}
        {OPERATEURS.map((operateur) => (
          <PaiementOperateurBouton key={operateur} reservationId={reservation.id} operateur={operateur} token={token} />
        ))}
      </View>
      {pollError && <Text className="text-sm text-gray-500">{pollError}</Text>}
    </View>
  );
}
