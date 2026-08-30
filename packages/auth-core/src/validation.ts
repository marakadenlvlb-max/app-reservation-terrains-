import type { LoginPayload, RegisterPayload, UpdateProfilePayload } from './types';

/** Regex email volontairement simple : un garde-fou côté UI, pas une validation RFC complète. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Format téléphone volontairement permissif (8 à 15 chiffres, "+" optionnel) : le format exact
 * varie selon les pays/opérateurs couverts par Wave/Orange Money/Moov Money, et la validation
 * stricte d'un numéro appartient plutôt au backend au moment du paiement (RNF-002).
 */
const PHONE_REGEX = /^\+?[0-9\s]{8,15}$/;

// Hypothèse : ni le PRD ni le SRS ne fixent de seuil chiffré pour le mot de passe (RF-001) —
// 8 caractères est un minimum standard, à confirmer avec le backend/RNF-002 si une règle plus
// stricte est requise (ex. exigence de complexité).
export const MIN_PASSWORD_LENGTH = 8;

export interface RegisterValidationErrors {
  identifiant?: string;
  motDePasse?: string;
  sports?: string;
}

export interface LoginValidationErrors {
  identifiant?: string;
  motDePasse?: string;
}

export interface ProfileValidationErrors {
  nom?: string;
  sports?: string;
}

export function isEmailOrPhone(value: string): boolean {
  return EMAIL_REGEX.test(value) || PHONE_REGEX.test(value);
}

export function validateRegisterPayload(payload: RegisterPayload): RegisterValidationErrors {
  const errors: RegisterValidationErrors = {};
  const identifiant = payload.identifiant.trim();

  if (!identifiant) {
    errors.identifiant = 'Email ou téléphone requis.';
  } else if (!isEmailOrPhone(identifiant)) {
    errors.identifiant = 'Format invalide : saisis un email ou un numéro de téléphone valide.';
  }

  if (!payload.motDePasse || payload.motDePasse.length < MIN_PASSWORD_LENGTH) {
    errors.motDePasse = `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }

  if (payload.sports.length === 0) {
    // RF-001 : l'inscription doit renseigner au moins un sport pratiqué.
    errors.sports = 'Sélectionne au moins un sport pratiqué.';
  }

  return errors;
}

export function hasValidationErrors(
  errors: RegisterValidationErrors | LoginValidationErrors | ProfileValidationErrors
): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Validation de connexion (RF-002) : volontairement plus légère que l'inscription — on ne
 * revérifie ni le format de l'identifiant ni la longueur du mot de passe, seulement leur
 * présence. La correctness des identifiants est de la responsabilité du backend, qui seul peut
 * dire si le couple identifiant/mot de passe correspond à un compte existant.
 */
export function validateLoginPayload(payload: LoginPayload): LoginValidationErrors {
  const errors: LoginValidationErrors = {};

  if (!payload.identifiant.trim()) {
    errors.identifiant = 'Email ou téléphone requis.';
  }

  if (!payload.motDePasse) {
    errors.motDePasse = 'Mot de passe requis.';
  }

  return errors;
}

/**
 * Validation de l'édition de profil (RF-003). Le nom et au moins un sport restent requis (comme
 * à l'inscription) pour qu'un profil reste identifiable et cohérent avec RF-001 ; la ville est
 * volontairement optionnelle — le SRS ne l'impose pas comme obligatoire.
 */
export function validateProfilePayload(payload: UpdateProfilePayload): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};

  if (!payload.nom.trim()) {
    errors.nom = 'Le nom est requis pour être identifiable par les autres utilisateurs.';
  }

  if (payload.sports.length === 0) {
    errors.sports = 'Sélectionne au moins un sport pratiqué.';
  }

  return errors;
}
