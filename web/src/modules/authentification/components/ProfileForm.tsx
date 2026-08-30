'use client';

import { useEffect, useState } from 'react';
import { SPORT_OPTIONS, useProfileForm, usePhotoUpload } from '@app/auth-core';
import { webSessionStorage } from '../sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Formulaire d'édition du profil — US-03 / RF-003 (module Authentification & Profils).
 * Le token de session (US-02) est lu une fois au montage depuis webSessionStorage ; useProfileForm
 * ne déclenche l'appel de chargement qu'une fois ce token disponible.
 */
export function ProfileForm() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    webSessionStorage.getToken().then(setToken);
  }, []);

  const {
    loading,
    loadError,
    nom,
    ville,
    sports,
    photoUrl,
    errors,
    saving,
    saveError,
    saved,
    setNom,
    setVille,
    toggleSport,
    setPhotoUrl,
    save,
  } = useProfileForm({ apiBaseUrl: API_BASE_URL, token });

  const { uploading, error: photoError, upload } = usePhotoUpload({
    apiBaseUrl: API_BASE_URL,
    token,
    onUploaded: setPhotoUrl,
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);
    void upload(formData);
  };

  if (loading) {
    return <p>Chargement du profil…</p>;
  }

  if (loadError && !nom) {
    // On n'affiche l'erreur bloquante que si le profil n'a jamais pu être chargé (pas de données
    // à éditer) — une fois chargé, une erreur ultérieure ne doit pas faire disparaître le formulaire.
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
      <h1 className="text-xl font-semibold">Mon profil</h1>

      <div className="flex flex-col items-start gap-2">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar dynamique, pas d'intérêt à next/image ici
          <img src={photoUrl} alt="Photo de profil" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gray-200" aria-hidden />
        )}
        <label htmlFor="photo" className="text-sm font-medium">
          Photo de profil
        </label>
        <input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} />
        {uploading && <p className="text-sm text-gray-500">Envoi de la photo…</p>}
        {photoError && (
          <p role="alert" className="text-sm text-red-600">
            {photoError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className="text-sm font-medium">
          Nom
        </label>
        <input
          id="nom"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
          aria-invalid={Boolean(errors.nom)}
        />
        {errors.nom && <p className="text-sm text-red-600">{errors.nom}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ville" className="text-sm font-medium">
          Ville
        </label>
        <input
          id="ville"
          value={ville}
          onChange={(event) => setVille(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">Sport(s) pratiqué(s)</legend>
        <div className="flex gap-4">
          {SPORT_OPTIONS.map((sport) => (
            <label key={sport.value} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={sports.includes(sport.value)}
                onChange={() => toggleSport(sport.value)}
              />
              {sport.label}
            </label>
          ))}
        </div>
        {errors.sports && <p className="text-sm text-red-600">{errors.sports}</p>}
      </fieldset>

      {saveError && (
        <p role="alert" className="text-sm text-red-600">
          {saveError}
        </p>
      )}
      {saved && <p className="text-sm text-green-600">Profil mis à jour.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
