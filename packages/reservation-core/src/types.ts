/**
 * Types dérivés de l'entité RESERVATION du modèle de données (architecture.md, section 3) —
 * US-10 / RF-010.
 *
 * `statut` n'est pas un enum fermé dans le modèle de données ; on sait avec certitude qu'une
 * réservation fraîchement créée par ce flux est 'en_attente_paiement' (RF-010), et qu'elle
 * deviendra 'confirmee' (RF-014) ou redeviendra le créneau disponible en cas d'échec — même
 * approche que `CreneauStatut` dans @app/annonces-core, pour la même raison (rien de figé côté
 * backend pour l'instant).
 */
export type ReservationStatut = 'en_attente_paiement' | 'confirmee' | 'annulee' | (string & {});

/**
 * ⚠️ `expireA` n'est PAS un champ de l'entité RESERVATION dans architecture.md (qui liste
 * seulement id, creneau_id, joueur_id, statut, montant, created_at). C'est une hypothèse
 * frontend : le verrouillage temporaire exigé par RF-010 a nécessairement une échéance, que le
 * backend peut calculer à la volée (`created_at` + une durée fixe de verrou) sans colonne
 * supplémentaire. Contrairement à l'écart des sports pratiqués (US-03), aucune donnée n'est
 * perdue si cette hypothèse est fausse : le backend peut simplement renvoyer ce champ calculé
 * dans la réponse JSON sans toucher au schéma. À confirmer avec le contrat d'API réel une fois
 * le backend implémenté.
 */
export interface Reservation {
  id: string;
  creneauId: string;
  joueurId: string;
  statut: ReservationStatut;
  montant: number;
  createdAt: string;
  /** Timestamp ISO 8601 — date/heure à laquelle le verrou temporaire expire si le paiement n'a pas abouti. */
  expireA: string;
}
