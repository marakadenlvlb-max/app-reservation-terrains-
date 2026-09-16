import type { Profile, UpdateProfilePayload } from './types';

/**
 * Appels à l'API backend (Laravel, module Authentification & Profils — architecture.md
 * section 2) pour l'édition du profil — RF-003. Endpoints implémentés et testés côté backend
 * (skill dev-laravel, `backend/app/Http/Controllers/Api/Authentification/ProfilController.php`).
 */
export async function fetchProfile(apiBaseUrl: string, token: string): Promise<Profile> {
  const response = await fetch(`${apiBaseUrl}/api/profile`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Impossible de charger le profil. Réessaie plus tard.');
  }

  return response.json();
}

export async function updateProfile(
  payload: UpdateProfilePayload,
  apiBaseUrl: string,
  token: string
): Promise<Profile> {
  const response = await fetch(`${apiBaseUrl}/api/profile`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? 'La mise à jour du profil a échoué. Réessaie plus tard.');
  }

  return response.json();
}

/**
 * L'upload de la photo est séparé de la mise à jour des champs texte (endpoint multipart dédié)
 * car web et mobile construisent des FormData différents : un objet `File` du navigateur côté
 * web, un objet `{ uri, name, type }` côté mobile (React Native ne connaît pas `File`). Chaque
 * plateforme construit son propre FormData ; ce module se contente de l'envoyer.
 */
export async function uploadProfilePhoto(
  formData: FormData,
  apiBaseUrl: string,
  token: string
): Promise<{ photoUrl: string }> {
  const response = await fetch(`${apiBaseUrl}/api/profile/photo`, {
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
