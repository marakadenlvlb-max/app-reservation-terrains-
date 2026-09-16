import type { CreateTerrainPayload } from './types';

export interface CreateTerrainValidationErrors {
  sport?: string;
  adresse?: string;
  paliers?: string;
}

export function hasValidationErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Validation de publication d'annonce (RF-004/RF-005). `sport` et `adresse` sont les deux seuls
 * champs vraiment indispensables pour qu'une annonce soit exploitable en recherche (RF-007) ;
 * `type` et `equipements` restent optionnels (voir le commentaire dans types.ts).
 *
 * RF-021 (correction du 9 septembre 2026) : `paliers` doit contenir au moins un élément — le
 * backend refuse de toute façon la publication/modification sans (TerrainRequest), revérifié ici
 * pour un retour immédiat plutôt que d'attendre l'aller-retour réseau.
 */
export function validateCreateTerrainPayload(
  payload: CreateTerrainPayload
): CreateTerrainValidationErrors {
  const errors: CreateTerrainValidationErrors = {};

  if (!payload.sport) {
    errors.sport = 'Sélectionne le sport pratiqué sur ce terrain.';
  }

  if (!payload.adresse.trim()) {
    errors.adresse = "L'adresse est requise pour que les joueurs puissent te trouver.";
  }

  if (payload.paliers.length === 0) {
    errors.paliers = "Configure au moins un palier d'annulation avant de publier ce terrain.";
  }

  return errors;
}

export interface CreateCreneauValidationErrors {
  debut?: string;
  fin?: string;
  tarif?: string;
}

/**
 * Format volontairement identique des deux côtés (web et mobile) : "AAAA-MM-JJTHH:MM", le même
 * que produit un `<input type="datetime-local">` web. Ça évite d'avoir deux formats de date à
 * réconcilier alors qu'aucun composant de sélection de date natif n'a encore été ajouté côté
 * mobile (voir le commentaire dans CreneauxScreen.tsx).
 */
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function isValidDatetime(value: string): boolean {
  return DATETIME_REGEX.test(value) && !Number.isNaN(new Date(value).getTime());
}

/**
 * Validation de création de créneau (RF-006). La contrainte "fin après début" est vérifiée ici
 * côté UI pour un retour immédiat, mais reste à revalider côté backend — deux utilisateurs
 * pourraient soumettre des créneaux qui se chevauchent, ce que seul le backend peut arbitrer avec
 * une vraie transaction (cf. RF-010, verrouillage de créneau).
 */
export function validateCreateCreneauPayload(payload: {
  debut: string;
  fin: string;
  tarif: number;
}): CreateCreneauValidationErrors {
  const errors: CreateCreneauValidationErrors = {};

  if (!isValidDatetime(payload.debut)) {
    errors.debut = 'Date et heure de début requises (format AAAA-MM-JJTHH:MM).';
  }

  if (!isValidDatetime(payload.fin)) {
    errors.fin = 'Date et heure de fin requises (format AAAA-MM-JJTHH:MM).';
  } else if (isValidDatetime(payload.debut) && new Date(payload.fin) <= new Date(payload.debut)) {
    errors.fin = 'La fin doit être après le début.';
  }

  if (!payload.tarif || payload.tarif <= 0) {
    errors.tarif = 'Le tarif doit être un nombre positif.';
  }

  return errors;
}
