'use client';

import { useEffect, useState } from 'react';
import { NOTE_MAX, NOTE_MIN, useNoterSession } from '@app/notation-core';
import { webSessionStorage } from '../../authentification/sessionStorage';
import { NoteMoyenneBadge } from './NoteMoyenneBadge';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const NOTES = Array.from({ length: NOTE_MAX - NOTE_MIN + 1 }, (_, i) => NOTE_MIN + i);

/**
 * Formulaire de notation d'une session — US-16 / RF-016 (module Notation & Réputation).
 * `reservationId`/`cibleId` viennent de la route plutôt que d'un contexte "réservation
 * courante" : aucun écran "historique des réservations" (US-18/US-19) n'existe encore pour y
 * naviguer depuis une vraie liste — même limite que ReserverCreneauBouton avant US-08.
 */
export function NotationForm({ reservationId, cibleId }: { reservationId: string; cibleId: string }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    webSessionStorage.getToken().then(setToken);
  }, []);

  const { note, commentaire, submitting, submitError, submitted, setNote, setCommentaire, submit } =
    useNoterSession({ apiBaseUrl: API_BASE_URL, token: token ?? null });

  if (token === undefined) {
    return null;
  }

  if (token === null) {
    return <p className="text-sm text-blue-600">Connecte-toi pour laisser une note.</p>;
  }

  if (submitted) {
    return <p className="text-sm text-green-600">Merci, ta note a bien été enregistrée.</p>;
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit(reservationId, cibleId);
      }}
    >
      <div>
        <h1 className="text-xl font-semibold">Noter cette session</h1>
        <p className="text-sm text-gray-600">
          Note actuelle de cette personne : <NoteMoyenneBadge utilisateurId={cibleId} />
        </p>
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">Note</legend>
        <div className="flex gap-2">
          {NOTES.map((value) => (
            <label key={value} className="flex items-center gap-1 text-sm">
              <input type="radio" name="note" checked={note === value} onChange={() => setNote(value)} />
              {value}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="commentaire" className="text-sm font-medium">
          Commentaire (optionnel)
        </label>
        <textarea
          id="commentaire"
          value={commentaire}
          onChange={(event) => setCommentaire(event.target.value)}
          rows={3}
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
        disabled={submitting}
        className="self-start rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Envoi…' : 'Envoyer ma note'}
      </button>
    </form>
  );
}
