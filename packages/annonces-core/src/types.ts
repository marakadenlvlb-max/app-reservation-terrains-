import type { Equipement, Sport } from '@app/shared';

/**
 * Types dérivés de l'entité TERRAIN du modèle de données (architecture.md, section 3).
 *
 * US-04 / RF-004 (et RF-005 pour un gestionnaire — mêmes modalités, seul le rôle du compte
 * change côté backend) : publication d'une annonce. RF-004 mentionne "sport, adresse, photos,
 * tarif" mais TERRAIN n'a pas de champ tarif dans le modèle de données — le tarif vit sur
 * CRENEAU (RF-006 / US-05, chaque créneau a son propre tarif), donc ce payload n'en inclut pas :
 * l'annonce se crée d'abord, les créneaux tarifés s'ajoutent ensuite.
 *
 * `type` et `equipements` existent dans l'entité TERRAIN mais ne sont pas explicitement listés
 * dans le texte de RF-004 ; on les inclut ici en champs optionnels (comme `ville` pour le profil,
 * US-03) plutôt que de forcer une édition séparée juste après la création.
 *
 * `Equipement` vit dans @app/shared (utilisé aussi par le détail d'annonce du module Recherche &
 * Catalogue, US-08) et est ré-exporté ici pour ne pas casser les imports existants.
 */
export type { Equipement } from '@app/shared';

/**
 * RF-021 (correction du 9 septembre 2026) : la politique d'annulation d'un terrain n'est plus un
 * seuil unique décidé par l'application — chaque propriétaire/gestionnaire configure ses propres
 * paliers, illimités, par terrain. `delaiMinutes` : en dessous de ce délai (en minutes avant le
 * début du créneau), ce palier ne s'applique plus au profit d'un palier plus strict (ou d'aucun
 * remboursement si aucun palier n'est respecté) — voir `estReservationAnnulable` côté
 * historique-core pour la seule condition vérifiée côté frontend (créneau pas encore commencé).
 */
export interface PalierAnnulation {
  delaiMinutes: number;
  pourcentageRemboursement: number;
}

export interface CreateTerrainPayload {
  sport: Sport;
  adresse: string;
  type?: string;
  equipements: Equipement[];
  /** Au moins un palier requis (RF-021) : le backend refuse la publication/modification sans. */
  paliers: PalierAnnulation[];
  /**
   * Frais de transaction déduits d'un remboursement, propres à ce terrain — `undefined`/`null`
   * laisse le backend calculer un taux par défaut selon le nombre de terrains du propriétaire
   * (et l'en avertit par notification), une valeur fixe le taux explicitement.
   */
  fraisAnnulationPourcentage?: number | null;
}

/**
 * US-06 : même forme que la création — modifier une annonce, c'est renvoyer les mêmes champs
 * avec de nouvelles valeurs. Un alias plutôt qu'une interface dupliquée évite que les deux
 * dérivent silencieusement l'une de l'autre au fil des évolutions.
 */
export type UpdateTerrainPayload = CreateTerrainPayload;

export interface Terrain {
  id: string;
  proprietaireId: string;
  sport: Sport;
  adresse: string;
  /** Géocodées côté backend à partir de `adresse` — jamais saisies par le frontend (voir profileApi côté auth pour le même principe d'upload séparé). */
  latitude: number | null;
  longitude: number | null;
  type: string | null;
  equipements: Equipement[];
  photos: string[];
  paliers: PalierAnnulation[];
  fraisAnnulationPourcentage: number;
}

/**
 * Dérivé de l'entité CRENEAU (architecture.md, section 3) — RF-006 / US-05. `statut` n'est pas
 * un enum fermé dans le modèle de données ; on ne connaît avec certitude que 'disponible' (état
 * initial à la création) et 'reserve' (une fois occupé par une RESERVATION, RF-010). D'autres
 * valeurs pourraient apparaître avec le verrouillage temporaire (US-10, pas encore implémenté) —
 * `string` reste le type le plus honnête tant que ce n'est pas figé côté backend.
 */
export type CreneauStatut = 'disponible' | 'reserve' | (string & {});

export interface Creneau {
  id: string;
  terrainId: string;
  /** ISO 8601 (ex. "2026-09-01T18:00") — jamais un objet Date : évite les soucis de fuseau/format entre web et mobile. */
  debut: string;
  fin: string;
  tarif: number;
  statut: CreneauStatut;
}

export interface CreateCreneauPayload {
  terrainId: string;
  debut: string;
  fin: string;
  tarif: number;
}

/** US-06 : mêmes champs modifiables que la création, sans `terrainId` (un créneau ne change pas de terrain). */
export interface UpdateCreneauPayload {
  debut: string;
  fin: string;
  tarif: number;
}
