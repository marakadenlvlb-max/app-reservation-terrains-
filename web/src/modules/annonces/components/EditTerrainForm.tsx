'use client';

import { useState } from 'react';
import { useSessionToken } from '@app/auth-core';
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
  // BUG-005 (rapport-qa.md, corrigé le 31 août 2026) : quatrième occurrence du même défaut que
  // BUG-002 — désormais éliminée à la racine via useSessionToken (packages/auth-core), qui
  // distingue "pas encore lu" (undefined) de "confirmé non connecté" (null) une fois pour toutes.
  const token = useSessionToken(webSessionStorage);
  const [deleted, setDeleted] = useState(false);

  const {
    loading,
    loadError,
    sport,
    adresse,
    type,
    equipements,
    paliers,
    fraisAnnulationPourcentage,
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
    addPalier,
    updatePalier,
    removePalier,
    setFraisAnnulationPourcentage,
    reinitialiserFraisAnnulation,
    save,
    remove,
  } = useEditTerrainForm({
    terrainId,
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
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

  if (token === undefined || loading) {
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
          Frais de transaction sur remboursement
        </label>
        <div className="flex items-center gap-2">
          <input
            id="fraisAnnulation"
            type="number"
            min={0}
            max={100}
            value={fraisAnnulationPourcentage}
            onChange={(event) => setFraisAnnulationPourcentage(event.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
          <button type="button" onClick={reinitialiserFraisAnnulation} className="text-sm text-blue-600">
            Revenir au taux par défaut
          </button>
        </div>
      </div>

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
