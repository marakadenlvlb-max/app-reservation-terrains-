import type { CreateCreneauPayload, Creneau, UpdateCreneauPayload } from './types';

/**
 * Appels à l'API backend (Laravel, module Annonces & Créneaux — architecture.md section 2) pour
 * la gestion des créneaux — RF-006. Endpoints implémentés et testés côté backend (skill
 * dev-laravel, `backend/app/Http/Controllers/Api/Annonces/CreneauController.php`).
 */
export async function fetchCreneaux(
  terrainId: string,
  apiBaseUrl: string,
  token: string
): Promise<Creneau[]> {
  const response = await fetch(`${apiBaseUrl}/api/terrains/${terrainId}/creneaux`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Impossible de charger les créneaux. Réessaie plus tard.');
  }

  return response.json();
}

export async function createCreneau(
  payload: CreateCreneauPayload,
  apiBaseUrl: string,
  token: string
): Promise<Creneau> {
  const response = await fetch(`${apiBaseUrl}/api/terrains/${payload.terrainId}/creneaux`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ debut: payload.debut, fin: payload.fin, tarif: payload.tarif }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "L'ajout du créneau a échoué. Réessaie plus tard.");
  }

  return response.json();
}

/**
 * US-06 : modification et retrait d'un créneau existant. Comme pour `deleteTerrain`, le backend
 * reste seul juge d'un éventuel conflit (ex. créneau déjà réservé, RF-010) — le frontend applique
 * déjà une vérification côté client (voir useCreneaux) mais ne peut pas s'y fier seul : deux
 * onglets/appareils pourraient agir sur le même créneau en même temps.
 */
export async function updateCreneau(
  creneauId: string,
  payload: UpdateCreneauPayload,
  apiBaseUrl: string,
  token: string
): Promise<Creneau> {
  const response = await fetch(`${apiBaseUrl}/api/creneaux/${creneauId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? 'La modification du créneau a échoué. Réessaie plus tard.');
  }

  return response.json();
}

export async function deleteCreneau(creneauId: string, apiBaseUrl: string, token: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/creneaux/${creneauId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? 'Le retrait du créneau a échoué. Réessaie plus tard.');
  }
}
