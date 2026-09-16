'use client';

import { useState } from 'react';
import { useSessionToken } from '@app/auth-core';
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
  // BUG-003 (rapport-qa.md, corrigé le 31 août 2026) : useSessionToken distingue "pas encore lu"
  // (undefined) de "confirmé non connecté" (null) — élimine à la racine le risque qu'un
  // utilisateur bien connecté se fasse rejeter par submit() s'il soumet très vite après le
  // montage. Le formulaire reste volontairement saisissable avant résolution (voir le commentaire
  // équivalent côté mobile) ; seul le bouton de soumission est désactivé le temps de savoir si
  // `token` est réellement `null` ou une vraie session — voir plus bas.
  const token = useSessionToken(webSessionStorage);
  const [terrain, setTerrain] = useState<Terrain | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const {
    sport,
    adresse,
    type,
    equipements,
    paliers,
    fraisAnnulationPourcentage,
    errors,
    submitting,
    submitError,
    setSport,
    setAdresse,
    setType,
    toggleEquipement,
    addPalier,
    updatePalier,
    removePalier,
    setFraisAnnulationPourcentage,
    submit,
  } = useCreateTerrainForm({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
    onSuccess: setTerrain,
  });

  const { uploading, error: photoError, upload } = useTerrainPhotoUpload({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
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

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Politique d'annulation</legend>
        <p className="text-xs text-gray-500">
          Au moins un palier requis : délai minimum avant le créneau (en minutes) et pourcentage remboursé si le
          joueur annule à ce délai ou plus.
        </p>
        {paliers.map((palier, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              aria-label={`Délai en minutes du palier ${index + 1}`}
              value={palier.delaiMinutes}
              onChange={(event) => updatePalier(index, { ...palier, delaiMinutes: Number(event.target.value) })}
              className="w-24 rounded border border-gray-300 px-2 py-1"
            />
            <span className="text-sm">min avant →</span>
            <input
              type="number"
              min={0}
              max={100}
              aria-label={`Pourcentage remboursé du palier ${index + 1}`}
              value={palier.pourcentageRemboursement}
              onChange={(event) =>
                updatePalier(index, { ...palier, pourcentageRemboursement: Number(event.target.value) })
              }
              className="w-20 rounded border border-gray-300 px-2 py-1"
            />
            <span className="text-sm">%</span>
            <button type="button" onClick={() => removePalier(index)} className="text-sm text-red-600">
              Retirer
            </button>
          </div>
        ))}
        <button type="button" onClick={addPalier} className="self-start text-sm text-blue-600">
          + Ajouter un palier
        </button>
        {errors.paliers && <p className="text-sm text-red-600">{errors.paliers}</p>}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="fraisAnnulation" className="text-sm font-medium">
          Frais de transaction sur remboursement (optionnel)
        </label>
        <input
          id="fraisAnnulation"
          type="number"
          min={0}
          max={100}
          value={fraisAnnulationPourcentage}
          onChange={(event) => setFraisAnnulationPourcentage(event.target.value)}
          placeholder="Laisse vide pour un taux par défaut selon ton nombre de terrains"
          className="rounded border border-gray-300 px-3 py-2"
        />
      </div>

      {submitError && (
        <p role="alert" className="text-sm text-red-600">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || token === undefined}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Publication en cours…' : "Publier l'annonce"}
      </button>
    </form>
  );
}
