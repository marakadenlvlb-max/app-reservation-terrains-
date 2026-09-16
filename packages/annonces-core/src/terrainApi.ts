import type { CreateTerrainPayload, Terrain, UpdateTerrainPayload } from './types';

/**
 * Appels à l'API backend (Laravel, module Annonces & Créneaux — architecture.md section 2) pour
 * la publication d'une annonce — RF-004/RF-005. Endpoint implémenté et testé côté backend (skill
 * dev-laravel, `backend/app/Http/Controllers/Api/Annonces/TerrainController.php`). Le géocodage
 * de `adresse` en latitude/longitude (via OpenStreetMap Nominatim) est fait côté backend ; le
 * frontend n'envoie que l'adresse en texte.
 */
export async function createTerrain(
  payload: CreateTerrainPayload,
  apiBaseUrl: string,
  token: string
): Promise<Terrain> {
  const response = await fetch(`${apiBaseUrl}/api/terrains`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "La publication de l'annonce a échoué. Réessaie plus tard.");
  }

  return response.json();
}

/**
 * US-27 (module Navigation & Interface globale — "Mes annonces") : liste des terrains du
 * propriétaire/gestionnaire connecté, pour l'accueillir sur une page dédiée plutôt que de
 * n'atteindre chaque annonce que par une URL directe déjà connue (seul moyen jusqu'ici, faute de
 * routeur applicatif — voir backlog.md). Endpoint implémenté et testé côté backend (skill
 * dev-laravel, `backend/app/Http/Controllers/Api/Annonces/TerrainController.php@mesTerrains`).
 */
export async function fetchMesTerrains(apiBaseUrl: string, token: string): Promise<Terrain[]> {
  const response = await fetch(`${apiBaseUrl}/api/terrains/mes-terrains`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Impossible de charger tes annonces. Réessaie plus tard.');
  }

  return response.json();
}

/**
 * US-06 : chargement, modification et retrait d'une annonce déjà publiée. Restreint côté backend
 * au propriétaire de l'annonce (403 sinon).
 */
export async function fetchTerrain(terrainId: string, apiBaseUrl: string, token: string): Promise<Terrain> {
  const response = await fetch(`${apiBaseUrl}/api/terrains/${terrainId}`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Impossible de charger l'annonce. Réessaie plus tard.");
  }

  return response.json();
}

export async function updateTerrain(
  terrainId: string,
  payload: UpdateTerrainPayload,
  apiBaseUrl: string,
  token: string
): Promise<Terrain> {
  const response = await fetch(`${apiBaseUrl}/api/terrains/${terrainId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "La modification de l'annonce a échoué. Réessaie plus tard.");
  }

  return response.json();
}

/**
 * Retirer une annonce (US-06). Le backend est le seul à savoir si des réservations actives
 * dépendent encore de ce terrain (RF-010) — c'est à lui de refuser la suppression le cas échéant
 * (ex. HTTP 409) plutôt qu'au frontend de le deviner ; on se contente de relayer son message.
 */
export async function deleteTerrain(terrainId: string, apiBaseUrl: string, token: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/terrains/${terrainId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "Le retrait de l'annonce a échoué. Réessaie plus tard.");
  }
}

/**
 * Upload d'une photo pour un terrain déjà créé — endpoint multipart séparé, même principe que
 * l'upload de photo de profil (US-03 / usePhotoUpload) : chaque plateforme construit son propre
 * FormData (File web vs { uri, name, type } mobile), ce module se contente de l'envoyer.
 */
export async function uploadTerrainPhoto(
  terrainId: string,
  formData: FormData,
  apiBaseUrl: string,
  token: string
): Promise<{ photoUrl: string }> {
  const response = await fetch(`${apiBaseUrl}/api/terrains/${terrainId}/photos`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("L'envoi de la photo a échoué. Réessaie plus tard.");
  }

  return response.json();
}
