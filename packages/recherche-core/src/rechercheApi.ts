import type { RechercheFiltres, RechercheResultat, TerrainDetail } from './types';

/**
 * Appels à l'API backend (Laravel, module Recherche & Catalogue — architecture.md section 2)
 * pour la recherche (RF-007/RF-008/US-09) et la consultation d'une annonce (RF-009/US-08).
 *
 * Endpoints implémentés et testés côté backend (skill dev-laravel,
 * `backend/app/Http/Controllers/Api/Recherche/`). Le tri par proximité (RF-007) calcule
 * finalement la distance via la formule de Haversine côté application plutôt que par une requête
 * PostGIS — voir la correction du 9 septembre 2026 dans `architecture.md` section 4 pour le
 * détail (aucune colonne géométrique PostGIS dans le modèle de données, tests sur SQLite).
 *
 * Volontairement **sans** `token` : contrairement aux modules Authentification et Annonces, la
 * recherche et la consultation d'une annonce sont des fonctionnalités publiques — un visiteur non
 * connecté doit pouvoir parcourir le catalogue avant même de créer un compte. Seule la
 * réservation (US-10, plus loin) exigera une session.
 */
export async function searchTerrains(
  filtres: RechercheFiltres,
  apiBaseUrl: string
): Promise<RechercheResultat[]> {
  const params = new URLSearchParams();
  if (filtres.sport) params.set('sport', filtres.sport);
  if (filtres.localisation) params.set('localisation', filtres.localisation);
  if (filtres.date) params.set('date', filtres.date);
  if (filtres.heure) params.set('heure', filtres.heure);
  if (filtres.latitude !== undefined) params.set('latitude', String(filtres.latitude));
  if (filtres.longitude !== undefined) params.set('longitude', String(filtres.longitude));
  if (filtres.prixMax !== undefined) params.set('prixMax', String(filtres.prixMax));
  if (filtres.distanceMaxKm !== undefined) params.set('distanceMaxKm', String(filtres.distanceMaxKm));
  if (filtres.equipements && filtres.equipements.length > 0) params.set('equipements', filtres.equipements.join(','));

  const response = await fetch(`${apiBaseUrl}/api/recherche/terrains?${params.toString()}`);

  if (!response.ok) {
    throw new Error('La recherche a échoué. Réessaie plus tard.');
  }

  return response.json();
}

export async function fetchTerrainDetail(terrainId: string, apiBaseUrl: string): Promise<TerrainDetail> {
  const response = await fetch(`${apiBaseUrl}/api/terrains/${terrainId}/detail`);

  if (!response.ok) {
    throw new Error("Impossible de charger le détail de l'annonce. Réessaie plus tard.");
  }

  return response.json();
}
