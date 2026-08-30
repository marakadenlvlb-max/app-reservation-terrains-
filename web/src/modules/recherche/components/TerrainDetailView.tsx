'use client';

import { useTerrainDetail } from '@app/recherche-core';
import { EQUIPEMENT_OPTIONS } from '@app/shared';
import { ReserverCreneauBouton } from './ReserverCreneauBouton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const EQUIPEMENT_LABELS = Object.fromEntries(EQUIPEMENT_OPTIONS.map((option) => [option.value, option.label]));

/**
 * Détail d'une annonce — US-08 / RF-009 : photos, équipements, note moyenne du propriétaire/
 * gestionnaire, créneaux encore disponibles. Page publique, consultable sans connexion ; seul le
 * bouton de réservation par créneau (US-10, ReserverCreneauBouton) exige une session.
 */
export function TerrainDetailView({ terrainId }: { terrainId: string }) {
  const { detail, loading, error } = useTerrainDetail({ terrainId, apiBaseUrl: API_BASE_URL });

  if (loading) {
    return <p>Chargement de l'annonce…</p>;
  }

  if (error || !detail) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error ?? "Cette annonce n'existe pas ou n'est plus disponible."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {detail.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {detail.photos.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element -- galerie dynamique, next/image pas utile ici
            <img key={url} src={url} alt={`Photo du terrain ${detail.adresse}`} className="h-40 w-40 rounded object-cover" />
          ))}
        </div>
      )}

      <div>
        <h1 className="text-xl font-semibold">
          {detail.adresse} — {detail.sport}
        </h1>
        {detail.type && <p className="text-sm text-gray-600">{detail.type}</p>}
        <p className="text-sm text-gray-600">
          Note moyenne du propriétaire/gestionnaire :{' '}
          {detail.proprietaireNoteMoyenne !== null ? `${detail.proprietaireNoteMoyenne.toFixed(1)} / 5` : 'Pas encore de note'}
        </p>
      </div>

      {detail.equipements.length > 0 && (
        <div>
          <h2 className="text-sm font-medium">Équipements</h2>
          <ul className="flex gap-2 text-sm text-gray-600">
            {detail.equipements.map((equipement) => (
              <li key={equipement}>{EQUIPEMENT_LABELS[equipement] ?? equipement}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium">Créneaux disponibles</h2>
        {detail.creneauxDisponibles.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun créneau disponible pour l'instant.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {detail.creneauxDisponibles.map((creneau) => (
              <li key={creneau.id} className="flex flex-col gap-2 rounded border border-gray-200 px-3 py-2 text-sm">
                <span>
                  {creneau.debut.replace('T', ' ')} → {creneau.fin.replace('T', ' ')} — {creneau.tarif}
                </span>
                <ReserverCreneauBouton creneauId={creneau.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
