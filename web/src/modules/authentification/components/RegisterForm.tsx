'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SPORT_OPTIONS, useRegisterForm } from '@app/auth-core';

/**
 * Formulaire d'inscription joueur — US-01 / RF-001 (module Authentification & Profils).
 *
 * La validation et l'appel API vivent dans @app/auth-core (useRegisterForm) pour rester
 * réutilisables avec l'écran mobile équivalent (RegisterScreen) : ce composant se contente de
 * brancher l'UI web sur cette logique partagée.
 */
export function RegisterForm() {
  const router = useRouter();

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
      // US-27 referme ce TODO, mais PAS vers /accueil (page réservée aux utilisateurs connectés,
      // masquée sinon par NavBar) : `RegisterResult` (packages/auth-core/src/types.ts) ne renvoie
      // aucun token — contrairement à LoginResult, l'inscription ne crée pas de session. Découvert
      // en implémentant US-27 (backlog.md prévoyait "connexion ou inscription" vers /accueil sans
      // avoir vérifié ce détail) : on redirige donc vers /connexion pour que le compte fraîchement
      // créé s'authentifie explicitement, comme le prévoit RF-001/RF-002 (deux étapes séparées).
      router.push('/connexion');
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

      {/* US-28 : /connexion n'était atteignable depuis ici que par une URL tapée à la main. */}
      <Link href="/connexion" className="text-sm text-blue-600 underline">
        Déjà un compte ? Se connecter
      </Link>
    </form>
  );
}
