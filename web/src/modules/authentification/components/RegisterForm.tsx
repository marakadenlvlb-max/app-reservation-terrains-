'use client';

import { SPORT_OPTIONS, useRegisterForm } from '@app/auth-core';

/**
 * Formulaire d'inscription joueur — US-01 / RF-001 (module Authentification & Profils).
 *
 * La validation et l'appel API vivent dans @app/auth-core (useRegisterForm) pour rester
 * réutilisables avec l'écran mobile équivalent (RegisterScreen) : ce composant se contente de
 * brancher l'UI web sur cette logique partagée.
 */
export function RegisterForm() {
  const {
    identifiant,
    motDePasse,
    sports,
    errors,
    submitting,
    submitError,
    setIdentifiant,
    setMotDePasse,
    toggleSport,
    submit,
  } = useRegisterForm({
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
    onSuccess: () => {
      // TODO: rediriger vers l'étape suivante (édition du profil, US-03) une fois le routing
      // de l'app défini au-delà de cette seule page.
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h1 className="text-xl font-semibold">Créer un compte</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="identifiant" className="text-sm font-medium">
          Email ou téléphone
        </label>
        <input
          id="identifiant"
          name="identifiant"
          type="text"
          value={identifiant}
          onChange={(event) => setIdentifiant(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
          aria-invalid={Boolean(errors.identifiant)}
          aria-describedby={errors.identifiant ? 'identifiant-error' : undefined}
        />
        {errors.identifiant && (
          <p id="identifiant-error" className="text-sm text-red-600">
            {errors.identifiant}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="motDePasse" className="text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          value={motDePasse}
          onChange={(event) => setMotDePasse(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
          aria-invalid={Boolean(errors.motDePasse)}
          aria-describedby={errors.motDePasse ? 'motDePasse-error' : undefined}
        />
        {errors.motDePasse && (
          <p id="motDePasse-error" className="text-sm text-red-600">
            {errors.motDePasse}
          </p>
        )}
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
        {submitting ? 'Création en cours…' : 'Créer mon compte'}
      </button>
    </form>
  );
}
