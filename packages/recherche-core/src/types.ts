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
/**
 * `prixMax`/`distanceMaxKm`/`equipements` sont l'ajout US-23 / RF-022. Aucun n'exige de
 * modification d'architecture.md : `prixMax` filtre sur `CRENEAU.tarif` (déjà modélisé),
 * `equipements` filtre sur `TERRAIN.equipements` (déjà modélisé, US-04), et `distanceMaxKm` est
 * une simple borne sur la distance déjà calculée côté backend pour `distanceKm` (US-09) — dans
 * les trois cas, filtrer une donnée déjà stockée n'ajoute rien au modèle de données, contrairement
 * aux écarts corrigés pour US-03/US-15/US-20/US-21 où la donnée elle-même n'avait nulle part où
 * être stockée.
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
  /** Tarif maximum accepté (même unité que `RechercheResultat.tarif`). */
  prixMax?: number;
  /** Distance maximum en km — n'a de sens qu'accompagné d'une position (`latitude`/`longitude`, US-09) ; ignoré sinon. */
  distanceMaxKm?: number;
  /** Ne garder que les terrains possédant TOUS les équipements sélectionnés. */
  equipements?: Equipement[];
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
  /** US-23 : équipements du terrain — projetés depuis `TERRAIN.equipements` (déjà présent dans TerrainDetail depuis US-08) pour que le résultat de recherche montre pourquoi il correspond à un filtre équipements. */
  equipements: Equipement[];
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
