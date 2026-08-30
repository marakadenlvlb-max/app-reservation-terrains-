import type { Equipement, Sport } from '@app/shared';

/**
 * Filtres de recherche — RF-007 (sport, localisation) + RF-008 (date, heure). Tous optionnels :
 * une recherche sans filtre ("je regarde ce qu'il y a") est un état légitime, pas une erreur —
 * rien dans le SRS n'impose de champ obligatoire ici, contrairement aux formulaires
 * d'inscription/publication des modules précédents.
 *
 * `latitude`/`longitude` (US-09 / RF-007 "proximité") sont optionnels et distincts de
 * `localisation` : ce dernier est un texte libre géocodé côté backend, alors que la position
 * vient directement du capteur GPS de l'appareil quand l'utilisateur active le tri par
 * proximité — les deux peuvent d'ailleurs être fournis ensemble (chercher "Dakar" et trier le
 * résultat par distance depuis sa position réelle).
 */
export interface RechercheFiltres {
  sport?: Sport;
  localisation?: string;
  /** Format "AAAA-MM-JJ". */
  date?: string;
  /** Format "HH:MM". */
  heure?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Un résultat = un créneau disponible avec les informations du terrain qui le porte — pas un
 * terrain seul. RF-008 est explicite : la recherche ne doit montrer que "les créneaux réellement
 * disponibles", donc le couple (terrain, créneau) est l'unité pertinente, cohérente avec
 * l'intention de la user story ("trouver un créneau qui me convient").
 */
export interface RechercheResultat {
  terrainId: string;
  sport: Sport;
  adresse: string;
  type: string | null;
  /** Première photo du terrain, pour la vignette de résultat — `null` si aucune photo (US-04, upload optionnel). */
  photoPrincipale: string | null;
  creneauId: string;
  debut: string;
  fin: string;
  tarif: number;
  /** Distance depuis la position fournie (US-09) — calculée côté backend via PostGIS, `undefined` si aucune position n'a été envoyée. */
  distanceKm?: number;
}

export interface TerrainDetailCreneau {
  id: string;
  debut: string;
  fin: string;
  tarif: number;
}

/**
 * Détail complet d'une annonce — US-08 / RF-009 (photos, tarif, équipements, note moyenne du
 * propriétaire/gestionnaire, avant réservation). Contrairement à `RechercheResultat` (un couple
 * terrain+créneau), c'est un terrain avec tous ses créneaux encore disponibles — l'utilisateur
 * choisit lequel réserver depuis cet écran (US-10, pas encore implémenté).
 */
export interface TerrainDetail {
  id: string;
  sport: Sport;
  adresse: string;
  type: string | null;
  equipements: Equipement[];
  photos: string[];
  /** `null` si le propriétaire/gestionnaire n'a pas encore reçu de note (RF-016/RF-017). */
  proprietaireNoteMoyenne: number | null;
  creneauxDisponibles: TerrainDetailCreneau[];
}
