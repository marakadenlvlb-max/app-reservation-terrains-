'use client';

import { useEffect, useState } from 'react';
import { EQUIPEMENT_OPTIONS, useEditTerrainForm } from '@app/annonces-core';
import { SPORT_OPTIONS } from '@app/shared';
import { webSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Modification et retrait d'une annonce — US-06 (module Annonces & Créneaux, complète RF-004/
 * RF-005/RF-006 : aucune exigence SRS numérotée dédiée à l'édition/suppression, mais le PRD
 * liste "publication d'une annonce" comme une capacité complète, pas seulement sa création).
 */
export function EditTerrainForm({ terrainId }: { terrainId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    webSessionStorage.getToken().then(setToken);
  }, []);

  const {
    loading,
    loadError,
    sport,
    adresse,
    type,
    equipements,
    errors,
    saving,
    saveError,
    saved,
    deleting,
    deleteError,
    setSport,
    setAdresse,
    setType,
    toggleEquipement,
    save,
    remove,
  } = useEditTerrainForm({
    terrainId,
    apiBaseUrl: API_BASE_URL,
    token,
    onDeleted: () => setDeleted(true),
  });

  const handleDelete = () => {
    // window.confirm plutôt qu'une modale custom : retirer une annonce est irréversible côté
    // utilisateur (et peut affecter des créneaux déjà publiés), donc une confirmation explicite
    // est nécessaire avant l'appel API.
    if (window.confirm('Retirer définitivement cette annonce ?')) {
      void remove();
    }
  };

  if (deleted) {
    return <p className="text-sm text-green-600">Annonce retirée.</p>;
  }

  if (loading) {
    return <p>Chargement de l'annonce…</p>;
  }

  if (loadError && !adresse) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {loadError}
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <h1 className="text-xl font-semibold">Modifier l'annonce</h1>

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

      {saveError && (
        <p role="alert" className="text-sm text-red-600">
          {saveError}
        </p>
      )}
      {saved && <p className="text-sm text-green-600">Annonce mise à jour.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded border border-red-300 px-4 py-2 font-medium text-red-600 disabled:opacity-50"
      >
        {deleting ? 'Retrait en cours…' : "Retirer l'annonce"}
      </button>
      {deleteError && (
        <p role="alert" className="text-sm text-red-600">
          {deleteError}
        </p>
      )}
    </form>
  );
}
