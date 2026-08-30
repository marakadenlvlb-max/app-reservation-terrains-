import { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useCreneaux, type Creneau } from '@app/annonces-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const STATUT_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  reserve: 'Réservé',
};

/**
 * Gestion des créneaux d'un terrain — US-05 (ajout) / US-06 (modification, retrait). Équivalent
 * mobile de CreneauxManager (web), même hook partagé (useCreneaux).
 *
 * `terrainId` est un prop plutôt que lu depuis un routeur : aucune librairie de navigation
 * (ex. Expo Router) n'est encore en place dans ce projet — voir les mêmes TODOs "routing" laissés
 * dans RegisterScreen/LoginScreen. Une fois le routing choisi, `terrainId` viendra des paramètres
 * de route au lieu d'être passé manuellement.
 *
 * Saisie des dates en texte ("AAAA-MM-JJTHH:MM") plutôt qu'un vrai sélecteur natif
 * (@react-native-community/datetimepicker) : à remplacer avant mise en production pour une
 * meilleure UX, ajouté ici en dépendance minimale pour rester cohérent avec le format web
 * (input datetime-local) sans dépendance native supplémentaire pour cette V1.
 */
export function CreneauxScreen({ terrainId }: { terrainId: string }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    mobileSessionStorage.getToken().then(setToken);
  }, []);

  const {
    creneaux,
    loading,
    loadError,
    debut,
    fin,
    tarif,
    errors,
    submitting,
    submitError,
    setDebut,
    setFin,
    setTarif,
    addCreneau,
    updatingId,
    updateError,
    updateCreneau,
    removingId,
    removeError,
    removeCreneau,
  } = useCreneaux({ terrainId, apiBaseUrl: API_BASE_URL, token });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (loadError && creneaux.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {loadError}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-6 px-6 pt-16">
      <View>
        <Text className="text-xl font-semibold">Créneaux du terrain</Text>
        {creneaux.length === 0 ? (
          <Text className="text-sm text-gray-500">Aucun créneau défini pour l'instant.</Text>
        ) : (
          <FlatList
            data={creneaux}
            keyExtractor={(item: Creneau) => item.id}
            renderItem={({ item }) => (
              <CreneauRow
                creneau={item}
                updating={updatingId === item.id}
                removing={removingId === item.id}
                onSave={(payload) => updateCreneau(item.id, payload)}
                onRemove={() => removeCreneau(item.id)}
              />
            )}
          />
        )}
        {updateError && (
          <Text accessibilityRole="alert" className="mt-2 text-sm text-red-600">
            {updateError}
          </Text>
        )}
        {removeError && (
          <Text accessibilityRole="alert" className="mt-2 text-sm text-red-600">
            {removeError}
          </Text>
        )}
      </View>

      <View className="gap-4">
        <Text className="text-lg font-semibold">Ajouter un créneau</Text>

        <View className="gap-1">
          <Text className="text-sm font-medium">Début (AAAA-MM-JJTHH:MM)</Text>
          <TextInput
            accessibilityLabel="Début"
            value={debut}
            onChangeText={setDebut}
            placeholder="2026-09-01T18:00"
            className="rounded border border-gray-300 px-3 py-2"
          />
          {errors.debut && <Text className="text-sm text-red-600">{errors.debut}</Text>}
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium">Fin (AAAA-MM-JJTHH:MM)</Text>
          <TextInput
            accessibilityLabel="Fin"
            value={fin}
            onChangeText={setFin}
            placeholder="2026-09-01T19:00"
            className="rounded border border-gray-300 px-3 py-2"
          />
          {errors.fin && <Text className="text-sm text-red-600">{errors.fin}</Text>}
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium">Tarif</Text>
          <TextInput
            accessibilityLabel="Tarif"
            value={tarif}
            onChangeText={setTarif}
            keyboardType="numeric"
            className="rounded border border-gray-300 px-3 py-2"
          />
          {errors.tarif && <Text className="text-sm text-red-600">{errors.tarif}</Text>}
        </View>

        {submitError && (
          <Text accessibilityRole="alert" className="text-sm text-red-600">
            {submitError}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter le créneau"
          onPress={() => void addCreneau()}
          disabled={submitting}
          className="items-center rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-medium text-white">Ajouter le créneau</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

interface CreneauRowProps {
  creneau: Creneau;
  updating: boolean;
  removing: boolean;
  onSave: (payload: { debut: string; fin: string; tarif: number }) => Promise<boolean>;
  onRemove: () => void;
}

/** Même logique que CreneauRow côté web : mode édition local, désactivé pour un créneau réservé. */
function CreneauRow({ creneau, updating, removing, onSave, onRemove }: CreneauRowProps) {
  const [editing, setEditing] = useState(false);
  const [debut, setDebut] = useState(creneau.debut);
  const [fin, setFin] = useState(creneau.fin);
  const [tarif, setTarif] = useState(String(creneau.tarif));
  const reserve = creneau.statut === 'reserve';

  if (!editing) {
    return (
      <View className="mt-2 flex-row items-center justify-between rounded border border-gray-200 px-3 py-2">
        <Text className="flex-1 text-sm">
          {creneau.debut} → {creneau.fin} — {creneau.tarif} — {STATUT_LABELS[creneau.statut] ?? creneau.statut}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Modifier le créneau du ${creneau.debut}`}
          onPress={() => setEditing(true)}
          disabled={reserve}
        >
          <Text className={reserve ? 'text-gray-400' : 'text-blue-600'}>Modifier</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Retirer le créneau du ${creneau.debut}`}
          onPress={onRemove}
          disabled={reserve || removing}
          className="ml-3"
        >
          <Text className={reserve ? 'text-gray-400' : 'text-red-600'}>{removing ? 'Retrait…' : 'Retirer'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mt-2 gap-2 rounded border border-gray-200 px-3 py-2">
      <TextInput
        accessibilityLabel={`Début du créneau du ${creneau.debut}`}
        value={debut}
        onChangeText={setDebut}
        className="rounded border border-gray-300 px-2 py-1"
      />
      <TextInput
        accessibilityLabel={`Fin du créneau du ${creneau.debut}`}
        value={fin}
        onChangeText={setFin}
        className="rounded border border-gray-300 px-2 py-1"
      />
      <TextInput
        accessibilityLabel={`Tarif du créneau du ${creneau.debut}`}
        value={tarif}
        onChangeText={setTarif}
        keyboardType="numeric"
        className="rounded border border-gray-300 px-2 py-1"
      />
      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enregistrer"
          disabled={updating}
          onPress={async () => {
            const success = await onSave({ debut, fin, tarif: Number(tarif) });
            if (success) setEditing(false);
          }}
          className="rounded bg-blue-600 px-3 py-1"
        >
          <Text className="text-white">{updating ? 'Enregistrement…' : 'Enregistrer'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Annuler"
          onPress={() => setEditing(false)}
          className="rounded border border-gray-300 px-3 py-1"
        >
          <Text>Annuler</Text>
        </Pressable>
      </View>
    </View>
  );
}
