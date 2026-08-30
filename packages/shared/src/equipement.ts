/**
 * Équipements d'un terrain — utilisés par TERRAIN.equipements (module Annonces & Créneaux,
 * US-04/US-06) ET par le détail d'annonce consulté en recherche (module Recherche & Catalogue,
 * RF-009, US-08). Même raisonnement que `Sport` (voir sport.ts) : extrait ici plutôt que dans
 * l'un des deux modules pour ne pas créer une dépendance croisée entre eux.
 */
export type Equipement = 'vestiaires' | 'eclairage' | 'surface';

export const EQUIPEMENT_OPTIONS: { value: Equipement; label: string }[] = [
  { value: 'vestiaires', label: 'Vestiaires' },
  { value: 'eclairage', label: 'Éclairage' },
  { value: 'surface', label: 'Surface de qualité' },
];
