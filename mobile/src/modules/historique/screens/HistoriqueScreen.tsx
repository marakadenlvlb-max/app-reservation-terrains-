import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import {
  estReservationAnnulable,
  estSessionTerminee,
  useHistorique,
  type HistoriqueReservation,
  type HistoriqueRole,
} from '@app/historique-core';
import { useAnnulerReservation } from '@app/reservation-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const STATUT_LABELS: Record<string, string> = {
  en_attente_paiement: 'En attente de paiement',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
};

const TITRES: Record<HistoriqueRole, string> = {
  joueur: 'Mes réservations',
  proprietaire: 'Réservations reçues',
};

const AUTRE_PARTIE_LABELS: Record<HistoriqueRole, string> = {
  joueur: 'Propriétaire/gestionnaire',
  proprietaire: 'Joueur',
};

/**
 * US-29 (module Navigation & Interface globale, équivalent mobile d'US-28) : le tiroir ne pointe
 * que vers `/historique/joueur` (une seule entrée "Mes réservations" possible dans le menu) — ce
 * lien croisé permet d'atteindre l'autre vue depuis ici, même décision que HistoriqueList (web).
 */
const AUTRE_VUE: Record<HistoriqueRole, { href: string; label: string }> = {
  joueur: { href: '/historique/proprietaire', label: 'Voir les réservations reçues sur mes terrains' },
  proprietaire: { href: '/historique/joueur', label: 'Voir mes réservations en tant que joueur' },
};

/**
 * Historique des réservations — US-18/US-19. Équivalent mobile de HistoriqueList (web), même
 * hook partagé (useHistorique).
 */
export function HistoriqueScreen({ role }: { role: HistoriqueRole }) {
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    mobileSessionStorage.getToken().then(setToken);
  }, []);

  const { reservations, loading, error } = useHistorique({ role, apiBaseUrl: API_BASE_URL, token: token ?? null });
  const { annulingId, annulerError, annuler } = useAnnulerReservation({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  // Mise à jour locale après annulation plutôt qu'un re-fetch complet — même approche que la
  // mise à jour optimiste du "marquer comme lue" des notifications (US-20).
  const [statutOverrides, setStatutOverrides] = useState<Record<string, string>>({});
  const [messagesAnnulation, setMessagesAnnulation] = useState<Record<string, string>>({});

  const handleAnnuler = async (reservationId: string) => {
    const resultat = await annuler(reservationId);
    if (resultat) {
      setStatutOverrides((prev) => ({ ...prev, [reservationId]: 'annulee' }));
      setMessagesAnnulation((prev) => ({ ...prev, [reservationId]: resultat.message }));
    }
  };

  if (token === undefined || loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error && reservations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {error}
        </Text>
      </View>
    );
  }

  if (reservations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-sm text-gray-500">Aucune réservation pour l'instant.</Text>
        <Link href={AUTRE_VUE[role].href} className="text-sm text-blue-600">
          {AUTRE_VUE[role].label}
        </Link>
      </View>
    );
  }

  return (
    // Écran hors du groupe (drawer), donc sans en-tête : `pt-16` compensait déjà (avant SDK 57)
    // l'absence d'en-tête par une marge fixe, insuffisante depuis le passage en edge-to-edge sur
    // Android (SDK 54+) — combinée ici à l'inset dynamique réel de la barre de statut.
    <View className="flex-1 px-6" style={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom }}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-semibold">{TITRES[role]}</Text>
        <Link href={AUTRE_VUE[role].href} className="text-xs text-blue-600">
          {AUTRE_VUE[role].label}
        </Link>
      </View>
      {annulerError && (
        <Text accessibilityRole="alert" className="mb-2 text-sm text-red-600">
          {annulerError}
        </Text>
      )}
      <FlatList
        data={reservations}
        keyExtractor={(item: HistoriqueReservation) => item.id}
        renderItem={({ item }) => {
          const statut = statutOverrides[item.id] ?? item.statut;
          const effective = { ...item, statut };
          return (
            <View className="mb-2 rounded border border-gray-200 px-3 py-2">
              <Text className="font-medium">
                {item.terrain.adresse} — {item.terrain.sport}
              </Text>
              <Text className="text-sm">
                {item.creneau.debut} → {item.creneau.fin} — {item.montant}
              </Text>
              <Text className="text-sm text-gray-600">
                {AUTRE_PARTIE_LABELS[role]} : {item.autrePartie.nom} — {STATUT_LABELS[statut] ?? statut}
              </Text>
              {estSessionTerminee(effective) && (
                <Link href={`/reservations/${item.id}/noter/${item.autrePartie.id}`} className="text-blue-600">
                  Noter cette session
                </Link>
              )}
              <Link href={`/reservations/${item.id}/messages`} className="text-blue-600">
                Envoyer un message
              </Link>
              {role === 'joueur' && estReservationAnnulable(effective) && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Annuler ma réservation : ${item.terrain.adresse}`}
                  onPress={() => void handleAnnuler(item.id)}
                  disabled={annulingId === item.id}
                  className="mt-1 self-start"
                >
                  <Text className="text-sm text-red-600">
                    {annulingId === item.id ? 'Annulation en cours…' : 'Annuler ma réservation'}
                  </Text>
                </Pressable>
              )}
              {messagesAnnulation[item.id] && (
                <Text className="text-sm text-green-700">{messagesAnnulation[item.id]}</Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
