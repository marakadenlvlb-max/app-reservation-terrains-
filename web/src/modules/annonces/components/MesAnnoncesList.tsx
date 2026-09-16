'use client';

import Link from 'next/link';
import { useMesTerrains } from '@app/annonces-core';
import { useSessionToken } from '@app/auth-core';
import { webSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Liste des annonces du propriétaire/gestionnaire connecté — US-27 (module Navigation &
 * Interface globale), destination du lien de menu "Mes annonces". Avant cette user story, une
 * annonce ne s'atteignait que par une URL directe déjà connue (`/terrains/[id]`) — aucune vue
 * d'ensemble n'existait.
 */
export function MesAnnoncesList() {
  const token = useSessionToken(webSessionStorage);
  const { terrains, loading, error } = useMesTerrains({ apiBaseUrl: API_BASE_URL, token: token ?? null });

  if (token === undefined || loading) {
    return <p>Chargement de tes annonces…</p>;
  }

  if (error && terrains.length === 0) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mes annonces</h1>
        <Link href="/terrains/nouveau" className="text-sm text-blue-600 underline">
          Publier une nouvelle annonce
        </Link>
      </div>

      {terrains.length === 0 ? (
        <p className="text-sm text-gray-500">Tu n'as encore publié aucune annonce.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {terrains.map((terrain) => (
            <li key={terrain.id} className="rounded border border-gray-200 px-3 py-2 text-sm">
              <p className="font-medium">
                {terrain.adresse} — {terrain.sport}
              </p>
              <div className="flex gap-3">
                <Link href={`/terrains/${terrain.id}/modifier`} className="text-blue-600 underline">
                  Modifier
                </Link>
                <Link href={`/terrains/${terrain.id}/creneaux`} className="text-blue-600 underline">
                  Gérer les créneaux
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
