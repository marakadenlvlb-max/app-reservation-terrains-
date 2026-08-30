/**
 * Types dérivés de l'entité UTILISATEUR du modèle de données (architecture.md, section 3).
 *
 * US-01 / RF-001 ne couvre que l'inscription : identifiant + mot de passe + sports pratiqués.
 * Les autres champs de UTILISATEUR (nom, ville, photo_url...) sont renseignés lors de l'édition
 * du profil (US-03 / RF-003) et ne font donc pas partie de ce payload d'inscription.
 *
 * `Sport` vit dans @app/shared (utilisé aussi par le module Annonces & Créneaux) et est
 * ré-exporté ici pour ne pas casser les imports existants depuis @app/auth-core.
 */
import type { Sport } from '@app/shared';

export type { Sport } from '@app/shared';

export interface RegisterPayload {
  /** Email OU numéro de téléphone — RF-001 accepte les deux comme identifiant. */
  identifiant: string;
  motDePasse: string;
  sports: Sport[];
}

export interface RegisterResult {
  utilisateurId: string;
  identifiant: string;
}

/**
 * RF-002 — Connexion. Contrairement à l'inscription, le payload de connexion n'inclut pas les
 * sports pratiqués : ce n'est qu'un couple identifiant/mot de passe à vérifier côté backend.
 */
export interface LoginPayload {
  identifiant: string;
  motDePasse: string;
}

export interface LoginResult {
  utilisateurId: string;
  identifiant: string;
  /** Token de session (ex. Sanctum côté Laravel) à conserver pour authentifier les appels suivants. */
  token: string;
}

/**
 * RF-003 — Édition du profil (nom, ville, photo, sports pratiqués).
 *
 * Correspond au champ UTILISATEUR.sports_pratiques (architecture.md, section 3, corrigé le
 * 29 août 2026 — ce champ manquait initialement au modèle de données malgré RF-001/RF-003).
 */
export interface Profile {
  utilisateurId: string;
  nom: string;
  ville: string;
  photoUrl: string | null;
  sports: Sport[];
}

export interface UpdateProfilePayload {
  nom: string;
  ville: string;
  sports: Sport[];
}
