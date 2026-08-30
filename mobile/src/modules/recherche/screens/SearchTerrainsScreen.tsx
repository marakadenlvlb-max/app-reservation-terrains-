import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { useRechercheTerrains, type RechercheResultat } from '@app/recherche-core';
import { EQUIPEMENT_OPTIONS, SPORT_OPTIONS } from '@app/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Recherche de terrains disponibles — US-07 + US-09 (tri par proximité). Équivalent mobile de
 * SearchTerrains (web), même hook partagé (useRechercheTerrains). Fonctionnalité publique, pas de
 * lecture de session.
 */
export function SearchTerrainsScreen() {
  const {
    sport,
    localisation,
    date,
    heure,
    position,
    prixMax,
    distanceMaxKm,
    equipements,
    resultats,
    hasSearched,
    searching,
    searchError,
    setSport,
    setLocalisation,
    setDate,
    setHeure,
    setPosition,
    setPrixMax,
    setDistanceMaxKm,
    toggleEquipement,
    search,
  } = useRechercheTerrains({ apiBaseUrl: API_BASE_URL });

  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleSortByProximity = async () => {
    // expo-location plutôt que l'API Geolocation du navigateur : React Native n'y a pas accès,
    // contrairement au web (voir le commentaire équivalent dans SearchTerrains.tsx).
    setLocating(true);
    setGeoError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setGeoError('Autorise la localisation pour trier les résultats par proximité.');
        return;
      }
      const result = await Location.getCurrentPositionAsync({});
      const acquired = { latitude: result.coords.latitude, longitude: result.coords.longitude };
      setPosition(acquired);
      // On passe la position acquise directement à search() plutôt que de compter sur le
      // prochain rendu : voir le commentaire sur `search` dans useRechercheTerrains.ts.
      void search(acquired);
    } catch {
      setGeoError('Impossible de récupérer ta position.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <View className="flex-1 gap-6 px-6 pt-16">
      <Text className="text-xl font-semibold">Rechercher un terrain</Text>

      <View className="gap-1">
        <Text className="text-sm font-medium">Sport</Text>
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: sport === null }}
            accessibilityLabel="Tous"
            onPress={() => setSport(null)}
            className={`rounded border px-3 py-1 ${sport === null ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
          >
            <Text>Tous</Text>
          </Pressable>
          {SPORT_OPTIONS.map((option) => {
            const selected = sport === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={option.label}
                onPress={() => setSport(option.value)}
                className={`rounded border px-3 py-1 ${selected ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              >
                <Text>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium">Localisation</Text>
        <TextInput
          accessibilityLabel="Localisation"
          value={localisation}
          onChangeText={setLocalisation}
          placeholder="ex. Dakar, Plateau…"
          className="rounded border border-gray-300 px-3 py-2"
        />
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1 gap-1">
          <Text className="text-sm font-medium">Date (AAAA-MM-JJ)</Text>
          <TextInput
            accessibilityLabel="Date"
            value={date}
            onChangeText={setDate}
            placeholder="2026-09-01"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-sm font-medium">Heure (HH:MM)</Text>
          <TextInput
            accessibilityLabel="Heure"
            value={heure}
            onChangeText={setHeure}
            placeholder="18:00"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </View>
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1 gap-1">
          <Text className="text-sm font-medium">Prix max</Text>
          <TextInput
            accessibilityLabel="Prix max"
            value={prixMax}
            onChangeText={setPrixMax}
            keyboardType="numeric"
            placeholder="ex. 20000"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-sm font-medium">Distance max (km)</Text>
          <TextInput
            accessibilityLabel="Distance max (km)"
            value={distanceMaxKm}
            onChangeText={setDistanceMaxKm}
            keyboardType="numeric"
            editable={!!position}
            placeholder={position ? 'ex. 5' : 'Active ta position'}
            className={`rounded border border-gray-300 px-3 py-2 ${!position ? 'opacity-50' : ''}`}
          />
        </View>
      </View>
      {!position && (
        <Text className="text-xs text-gray-500">
          Le filtre de distance n'est utilisable qu'une fois ta position prise en compte.
        </Text>
      )}

      <View className="gap-1">
        <Text className="text-sm font-medium">Équipements</Text>
        <View className="flex-row flex-wrap gap-2">
          {EQUIPEMENT_OPTIONS.map((option) => {
            const selected = equipements.includes(option.value);
            return (
              <Pressable
                key={option.value}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={option.label}
                onPress={() => toggleEquipement(option.value)}
                className={`rounded border px-3 py-1 ${selected ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              >
                <Text>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Trier par proximité"
        onPress={() => void handleSortByProximity()}
        disabled={locating}
      >
        <Text className="text-sm text-blue-600 disabled:opacity-50">
          {locating ? 'Localisation en cours…' : position ? 'Position prise en compte — relancer' : 'Trier par proximité'}
        </Text>
      </Pressable>
      {geoError && (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {geoError}
        </Text>
      )}

      {searchError && (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {searchError}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Rechercher"
        onPress={() => void search()}
        disabled={searching}
        className="items-center rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
      >
        {searching ? <ActivityIndicator color="#fff" /> : <Text className="font-medium text-white">Rechercher</Text>}
      </Pressable>

      {hasSearched &&
        (resultats.length === 0 ? (
          <Text className="text-sm text-gray-500">Aucun créneau disponible pour ces critères.</Text>
        ) : (
          <FlatList
            data={resultats}
            keyExtractor={(item: RechercheResultat) => item.creneauId}
            renderItem={({ item }) => (
              <View className="mt-2 rounded border border-gray-200 px-3 py-2">
                <Text className="font-medium">
                  {item.adresse} — {item.sport}
                </Text>
                <Text>
                  {item.debut} → {item.fin} — {item.tarif}
                  {item.distanceKm !== undefined ? ` — à ${item.distanceKm.toFixed(1)} km` : ''}
                </Text>
                {item.equipements.length > 0 && (
                  <Text className="text-xs text-gray-500">
                    {item.equipements
                      .map((e) => EQUIPEMENT_OPTIONS.find((option) => option.value === e)?.label ?? e)
                      .join(', ')}
                  </Text>
                )}
                {/* TODO: navigation vers l'écran de détail (US-08) une fois un routeur choisi. */}
              </View>
            )}
          />
        ))}
    </View>
  );
}
