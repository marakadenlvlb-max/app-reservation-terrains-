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

/**
 * US-22 / RF-021 : réponse à une demande d'annulation. Contrairement aux écarts corrigés pour
 * US-03/US-15/US-20/US-21, ceci n'exige AUCUNE modification d'architecture.md : `RESERVATION.statut`
 * est déjà un champ `string` ouvert (voir `ReservationStatut` ci-dessus) qui accepte 'annulee'
 * depuis le départ, et un remboursement peut se représenter comme une simple valeur de plus du
 * champ `PAIEMENT.statut` (lui aussi `string` ouvert, voir architecture.md section 3) — aucune
 * des deux entités n'a besoin d'une colonne supplémentaire pour stocker le résultat d'une
 * annulation. Ce n'est donc qu'une transition de statut, pas un trou de modélisation.
 *
 * La "politique de délai définie" du RF-021 n'a volontairement aucune valeur en dur côté
 * frontend : décider si le délai est respecté (et donc si un remboursement est dû) est une règle
 * métier backend. Le frontend se contente de proposer l'action et d'afficher ce que le backend
 * répond — voir `estReservationAnnulable` dans @app/historique-core pour la seule condition que
 * le frontend vérifie lui-même (créneau pas encore commencé).
 */
export interface AnnulationReponse {
  /** `true` si le backend a déclenché un remboursement, `false` si l'annulation est actée sans remboursement. */
  rembourse: boolean;
  /** Message à afficher tel quel à l'utilisateur (ex. "Remboursement en cours via Wave sous 48h."). */
  message: string;
}
