import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionToken } from '@app/auth-core';
import { useCreneaux, type Creneau } from '@app/annonces-core';
import { mobileSessionStorage } from '../../authentification/sessionStorage';
import { DateTimePickerField } from '../components/DateTimePickerField';

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
 * Saisie de "Début"/"Fin" via un vrai sélecteur natif (@react-native-community/datetimepicker,
 * voir DateTimePickerField) — équivalent mobile de l'input HTML `datetime-local` déjà utilisé côté
 * web. Le format produit (AAAA-MM-JJTHH:MM) reste identique, seule l'UI de saisie a changé.
 */
export function CreneauxScreen({ terrainId }: { terrainId: string }) {
  // BUG-004 (rapport-qa.md, corrigé le 31 août 2026) : useSessionToken élimine à la racine le
  // défaut qui confondait "pas encore lu" et "confirmé non connecté" (troisième occurrence de ce
  // motif dans le projet avant l'extraction de ce hook partagé).
  const token = useSessionToken(mobileSessionStorage);
  const insets = useSafeAreaInsets();

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
  } = useCreneaux({ terrainId, apiBaseUrl: API_BASE_URL, token: token ?? null });

  if (token === undefined || loading) {
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
    // Écran hors du groupe (drawer), donc sans en-tête (voir HistoriqueScreen.tsx) — le bas compte
    // ici aussi : le formulaire "Ajouter un créneau" se termine en position naturelle tout en bas.
    <View
      className="flex-1 gap-6 px-6"
      style={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom }}
    >
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

        <DateTimePickerField label="Début" value={debut} onChange={setDebut} error={errors.debut} />

        <DateTimePickerField label="Fin" value={fin} onChange={setFin} error={errors.fin} />

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
      <DateTimePickerField label={`Début du créneau du ${creneau.debut}`} value={debut} onChange={setDebut} />
      <DateTimePickerField label={`Fin du créneau du ${creneau.debut}`} value={fin} onChange={setFin} />
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
