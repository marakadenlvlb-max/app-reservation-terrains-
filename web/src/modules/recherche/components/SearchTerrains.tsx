'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRechercheTerrains } from '@app/recherche-core';
import { EQUIPEMENT_OPTIONS, SPORT_OPTIONS } from '@app/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Recherche de terrains disponibles — US-07 / RF-007 (sport, localisation) + RF-008 (date,
 * heure) + US-09 (tri par proximité), module Recherche & Catalogue. Fonctionnalité publique : pas
 * de lecture de session ici, contrairement aux autres modules (voir le commentaire dans
 * rechercheApi.ts).
 */
export function SearchTerrains() {
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

  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const handleSortByProximity = () => {
    // API Geolocation native du navigateur (US-09) : aucune dépendance à installer côté web,
    // contrairement au mobile qui a besoin d'expo-location (pas d'accès direct au GPS en JS pur).
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (geoPosition) => {
        const acquired = { latitude: geoPosition.coords.latitude, longitude: geoPosition.coords.longitude };
        setPosition(acquired);
        setLocating(false);
        // On passe la position acquise directement à search() plutôt que de compter sur le
        // prochain rendu : voir le commentaire sur `search` dans useRechercheTerrains.ts.
        void search(acquired);
      },
      () => {
        setGeoError('Impossible de récupérer ta position. Vérifie les autorisations du navigateur.');
        setLocating(false);
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <h1 className="text-xl font-semibold">Rechercher un terrain</h1>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium">Sport</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" name="sport" checked={sport === null} onChange={() => setSport(null)} />
              Tous
            </label>
            {SPORT_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="sport"
                  checked={sport === option.value}
                  onChange={() => setSport(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1">
          <label htmlFor="localisation" className="text-sm font-medium">
            Localisation
          </label>
          <input
            id="localisation"
            value={localisation}
            onChange={(event) => setLocalisation(event.target.value)}
            placeholder="ex. Dakar, Plateau…"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="date" className="text-sm font-medium">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="heure" className="text-sm font-medium">
              Heure
            </label>
            <input
              id="heure"
              type="time"
              value={heure}
              onChange={(event) => setHeure(event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="prixMax" className="text-sm font-medium">
              Prix max
            </label>
            <input
              id="prixMax"
              type="number"
              min={0}
              value={prixMax}
              onChange={(event) => setPrixMax(event.target.value)}
              placeholder="ex. 20000"
              className="rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="distanceMaxKm" className="text-sm font-medium">
              Distance max (km)
            </label>
            <input
              id="distanceMaxKm"
              type="number"
              min={0}
              value={distanceMaxKm}
              onChange={(event) => setDistanceMaxKm(event.target.value)}
              disabled={!position}
              placeholder={position ? 'ex. 5' : 'Active ta position'}
              className="rounded border border-gray-300 px-3 py-2 disabled:opacity-50"
            />
          </div>
        </div>
        {!position && (
          <p className="text-xs text-gray-500">
            Le filtre de distance n'est utilisable qu'une fois ta position prise en compte (bouton ci-dessous).
          </p>
        )}

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium">Équipements</legend>
          <div className="flex flex-wrap gap-4">
            {EQUIPEMENT_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={equipements.includes(option.value)}
                  onChange={() => toggleEquipement(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={handleSortByProximity}
          disabled={locating}
          className="self-start text-sm text-blue-600 underline disabled:opacity-50"
        >
          {locating
            ? 'Localisation en cours…'
            : position
              ? 'Position prise en compte — relancer'
              : 'Trier par proximité (utiliser ma position)'}
        </button>
        {geoError && <p className="text-sm text-red-600">{geoError}</p>}

        {searchError && (
          <p role="alert" className="text-sm text-red-600">
            {searchError}
          </p>
        )}

        <button
          type="submit"
          disabled={searching}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {searching ? 'Recherche en cours…' : 'Rechercher'}
        </button>
      </form>

      {hasSearched && (
        <div>
          {resultats.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun créneau disponible pour ces critères.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {resultats.map((resultat) => (
                <li key={resultat.creneauId} className="rounded border border-gray-200 px-3 py-2 text-sm">
                  <Link href={`/terrains/${resultat.terrainId}`} className="font-medium underline">
                    {resultat.adresse} — {resultat.sport}
                  </Link>
                  <p>
                    {resultat.debut.replace('T', ' ')} → {resultat.fin.replace('T', ' ')} — {resultat.tarif}
                    {resultat.distanceKm !== undefined && ` — à ${resultat.distanceKm.toFixed(1)} km`}
                  </p>
                  {resultat.equipements.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {resultat.equipements
                        .map((e) => EQUIPEMENT_OPTIONS.find((option) => option.value === e)?.label ?? e)
                        .join(', ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
