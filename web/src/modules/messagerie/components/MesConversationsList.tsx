'use client';

import Link from 'next/link';
import { useMesConversations } from '@app/messagerie-core';
import { useSessionToken } from '@app/auth-core';
import { webSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Liste des conversations de l'utilisateur connecté — US-27 (module Navigation & Interface
 * globale), destination du lien de menu "Messagerie". Avant cette user story, une conversation ne
 * s'atteignait que depuis l'historique d'une réservation précise (HistoriqueList) — aucune vue
 * d'ensemble n'existait.
 */
export function MesConversationsList() {
  const token = useSessionToken(webSessionStorage);
  const { conversations, loading, error } = useMesConversations({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  if (token === undefined || loading) {
    return <p>Chargement de tes conversations…</p>;
  }

  if (error && conversations.length === 0) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (conversations.length === 0) {
    return <p className="text-sm text-gray-500">Aucune conversation pour l'instant.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Messagerie</h1>
      <ul className="flex flex-col gap-2">
        {conversations.map((conversation) => (
          <li key={conversation.reservationId} className="rounded border border-gray-200 px-3 py-2 text-sm">
            <Link href={`/reservations/${conversation.reservationId}/messages`} className="block">
              <p className="font-medium">
                {conversation.terrain.adresse} — {conversation.terrain.sport}
              </p>
              <p className="text-gray-600">Avec {conversation.autrePartie.nom}</p>
              {conversation.dernierMessage && (
                <p className="truncate text-gray-500">{conversation.dernierMessage.contenu}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
