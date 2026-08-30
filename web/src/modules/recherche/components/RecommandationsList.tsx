'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRecommandations } from '@app/recherche-core';
import { webSessionStorage } from '../../authentification/sessionStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Recommandations de terrains basées sur l'historique du joueur — US-25 / RF-024, module
 * Recommandations. Contrairement à SearchTerrains (US-07), pas de formulaire de filtre : la
 * liste est entièrement calculée côté backend, ce composant se contente de l'afficher — voir la
 * note sur `useRecommandations` (aucun ajout au modèle de données, lecture dérivée).
 */
export function RecommandationsList() {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    webSessionStorage.getToken().then(setToken);
  }, []);

  const { recommandations, loading, error } = useRecommandations({
    apiBaseUrl: API_BASE_URL,
    token: token ?? null,
  });

  if (token === undefined || loading) {
    return <p>Chargement de tes recommandations…</p>;
  }

  if (error && recommandations.length === 0) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (recommandations.length === 0) {
    return <p className="text-sm text-gray-500">Pas encore de recommandation — réserve un premier créneau pour en recevoir.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Recommandé pour toi</h1>
      <ul className="flex flex-col gap-2">
        {recommandations.map((terrain) => (
          <li key={terrain.terrainId} className="rounded border border-gray-200 px-3 py-2 text-sm">
            <Link href={`/terrains/${terrain.terrainId}`} className="font-medium underline">
              {terrain.adresse} — {terrain.sport}
            </Link>
            <p>À partir de {terrain.tarifMin}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
