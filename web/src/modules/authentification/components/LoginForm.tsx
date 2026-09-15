'use client';

import { useState } from 'react';
import { useLoginForm } from '@app/auth-core';
import { webSessionStorage } from '../sessionStorage';

/**
 * Formulaire de connexion — US-02 / RF-002 (module Authentification & Profils).
 * La validation, l'appel API et l'écriture du token vivent dans @app/auth-core (useLoginForm) ;
 * ce composant branche seulement l'UI web et le stockage de session propre au web.
 */
export function LoginForm() {
  // Confirmation visuelle locale au web (pas dans useLoginForm, partagé avec le mobile qui n'a pas
  // ce besoin) : en l'absence de redirection post-connexion (routing pas encore défini, voir
  // backlog.md), un login réussi ne changeait rien à l'écran — indiscernable d'un échec silencieux.
  const [connecte, setConnecte] = useState(false);

  const { identifiant, motDePasse, errors, submitting, submitError, setIdentifiant, setMotDePasse, submit } =
    useLoginForm({
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
      sessionStorage: webSessionStorage,
      onSuccess: () => {
        setConnecte(true);
        // TODO: rediriger vers le tableau de bord une fois le routing post-connexion défini.
      },
    });

  if (connecte) {
    return (
      <div className="flex flex-col gap-2" role="status">
        <h1 className="text-xl font-semibold">Connexion réussie ✓</h1>
        <p className="text-sm text-gray-600">Vous êtes bien connecté(e) en tant que {identifiant}.</p>
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
      <h1 className="text-xl font-semibold">Se connecter</h1>

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
        {submitting ? 'Connexion en cours…' : 'Se connecter'}
      </button>
    </form>
  );
}
