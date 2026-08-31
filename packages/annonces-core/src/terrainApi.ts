import type { CreateTerrainPayload, Terrain, UpdateTerrainPayload } from './types';

/**
 * Appels à l'API backend (Laravel, module Annonces & Créneaux — architecture.md section 2) pour
 * la publication d'une annonce — RF-004/RF-005.
 *
 * TODO: endpoint backend à confirmer/implémenter côté Laravel. Le géocodage de `adresse` en
 * latitude/longitude (architecture.md section 4 — intégration géolocalisation) est fait côté
 * backend ; le frontend n'envoie que l'adresse en texte.
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
 * US-06 : chargement, modification et retrait d'une annonce déjà publiée. Même TODO backend que
 * `createTerrain` ci-dessus.
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
