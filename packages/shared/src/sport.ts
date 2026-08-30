/**
 * Sports supportés par la plateforme — utilisés à la fois par UTILISATEUR.sports_pratiques
 * (module Authentification & Profils, RF-001/RF-003) et par TERRAIN.sport (module Annonces &
 * Créneaux, RF-004/RF-007). Extrait dans ce package partagé plutôt que dans l'un ou l'autre
 * module métier : ce n'est pas un concept propre à l'authentification, les deux modules en ont
 * besoin indépendamment (architecture.md, section 3 — modèle de données).
 */
export type Sport = 'foot' | 'tennis' | 'basket';

export const SPORT_OPTIONS: { value: Sport; label: string }[] = [
  { value: 'foot', label: 'Foot' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'basket', label: 'Basket' },
];
