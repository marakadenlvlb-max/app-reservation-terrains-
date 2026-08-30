'use client';

import { useEffect, useState } from 'react';
import { EQUIPEMENT_OPTIONS, useCreateTerrainForm, useTerrainPhotoUpload, type Terrain } from '@app/annonces-core';
import { SPORT_OPTIONS } from '@app/shared';
import { webSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Formulaire de publication d'une annonce — US-04 / RF-004 (module Annonces & Créneaux).
 * En deux temps, comme le suggère le modèle de données (architecture.md section 3) : l'annonce
 * est créée d'abord (sport, adresse, type, équipements), puis les photos s'ajoutent une fois
 * qu'un `terrainId` existe pour les rattacher.
 */
export function CreateTerrainForm() {
  const [token, setToken] = useState<string | null>(null);
  const [terrain, setTerrain] = useState<Terrain | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    webSessionStorage.getToken().then(setToken);
  }, []);

  const { sport, adresse, type, equipements, errors, submitting, submitError, setSport, setAdresse, setType, toggleEquipement, submit } =
    useCreateTerrainForm({
      apiBaseUrl: API_BASE_URL,
      token,
      onSuccess: setTerrain,
    });

  const { uploading, error: photoError, upload } = useTerrainPhotoUpload({
    apiBaseUrl: API_BASE_URL,
    token,
    onUploaded: (url) => setPhotoUrls((current) => [...current, url]),
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !terrain) return;

    const formData = new FormData();
    formData.append('photo', file);
    void upload(terrain.id, formData);
    event.target.value = '';
  };

  if (terrain) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-green-600">Annonce publiée. Ajoute des photos pour la rendre plus attractive.</p>

        <div className="flex flex-wrap gap-2">
          {photoUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element -- galerie dynamique, next/image pas utile ici
            <img key={url} src={url} alt="Photo du terrain" className="h-20 w-20 rounded object-cover" />
          ))}
        </div>

        <label htmlFor="photo" className="text-sm font-medium">
          Ajouter une photo
        </label>
        <input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} />
        {uploading && <p className="text-sm text-gray-500">Envoi de la photo…</p>}
        {photoError && (
          <p role="alert" className="text-sm text-red-600">
            {photoError}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h1 className="text-xl font-semibold">Publier une annonce</h1>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">Sport</legend>
        <div className="flex gap-4">
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
        {errors.sport && <p className="text-sm text-red-600">{errors.sport}</p>}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="adresse" className="text-sm font-medium">
          Adresse
        </label>
        <input
          id="adresse"
          value={adresse}
          onChange={(event) => setAdresse(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
          aria-invalid={Boolean(errors.adresse)}
        />
        {errors.adresse && <p className="text-sm text-red-600">{errors.adresse}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium">
          Type de terrain (optionnel)
        </label>
        <input
          id="type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          placeholder="ex. synthétique extérieur"
          className="rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">Équipements (optionnel)</legend>
        <div className="flex gap-4">
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

      {submitError && (
        <p role="alert" className="text-sm text-red-600">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Publication en cours…' : "Publier l'annonce"}
      </button>
    </form>
  );
}
