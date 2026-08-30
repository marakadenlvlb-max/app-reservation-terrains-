import type { Sport } from '@app/shared';
import type { ReservationStatut } from '@app/reservation-core';

/** Les deux historiques (RF-018 côté joueur, RF-019 côté propriétaire/gestionnaire) sont deux vues du même RESERVATION. */
export type HistoriqueRole = 'joueur' | 'proprietaire';

/**
 * Réservation enrichie pour l'affichage en historique — dérivée de RESERVATION mais complétée
 * par les infos de TERRAIN/CRENEAU et de l'autre partie prenante, que le backend doit joindre :
 * une liste d'ids RESERVATION seule ne permettrait pas d'afficher grand-chose d'utile (RF-018/
 * RF-019 attendent de voir *quoi* et *avec qui*, pas juste des identifiants).
 *
 * `autrePartie` généralise volontairement "l'autre joueur" (vue propriétaire, RF-019 : "qui a
 * réservé mon terrain") et "le propriétaire/gestionnaire" (vue joueur) : les deux vues sont
 * structurellement identiques, seul le point de vue change — un type et un hook uniques plutôt
 * que deux jeux dupliqués.
 */
export interface HistoriqueReservation {
  id: string;
  statut: ReservationStatut;
  montant: number;
  createdAt: string;
  terrain: {
    id: string;
    sport: Sport;
    adresse: string;
  };
  creneau: {
    id: string;
    debut: string;
    fin: string;
  };
  autrePartie: {
    id: string;
    nom: string;
  };
}
