'use client';

import { useEffect, useState } from 'react';
import { useMessages } from '@app/messagerie-core';
import { webSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Conversation liée à une réservation — US-24 / RF-023, module Messagerie. `reservationId` vient
 * de la route plutôt que d'un contexte "réservation courante" : même limite que NotationForm
 * (US-16), navigué depuis l'historique (HistoriqueList) faute de routeur applicatif complet.
 *
 * Accessible aussi bien pour une réservation encore `en_attente_paiement` que `confirmee` : la
 * user story évoque "poser une question... avant de réserver", ce qui correspond en pratique au
 * moment où une réservation existe déjà (verrouillage temporaire, RF-010) mais où le paiement n'a
 * pas encore été finalisé — pas une conversation hors réservation, que RF-023 n'envisage pas
 * ("au sujet d'une réservation").
 */
export function MessagerieView({ reservationId }: { reservationId: string }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [texte, setTexte] = useState('');

  useEffect(() => {
    webSessionStorage.getToken().then(setToken);
  }, []);

  const { messages, loading, error, sending, sendError, envoyer } = useMessages({
    reservationId,
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  if (token === undefined || loading) {
    return <p>Chargement de la conversation…</p>;
  }

  if (error && messages.length === 0) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Messages</h1>

      {messages.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun message pour l'instant. Pose ta question ci-dessous.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`max-w-[80%] rounded px-3 py-2 text-sm ${
                message.estDeMoi ? 'self-end bg-blue-600 text-white' : 'self-start bg-gray-100 text-gray-900'
              }`}
            >
              {message.contenu}
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          // Vidage immédiat plutôt qu'après résolution de l'envoi (UX de messagerie classique) :
          // `envoyer` avale ses propres erreurs dans `sendError`, pas besoin d'attendre pour ça.
          const contenu = texte;
          setTexte('');
          void envoyer(contenu);
        }}
      >
        <label htmlFor="contenu" className="sr-only">
          Message
        </label>
        <input
          id="contenu"
          value={texte}
          onChange={(event) => setTexte(event.target.value)}
          placeholder="Écris ton message…"
          className="flex-1 rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={sending || !texte.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {sending ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>
      {sendError && (
        <p role="alert" className="text-sm text-red-600">
          {sendError}
        </p>
      )}
    </div>
  );
}
