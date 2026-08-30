/**
 * Types dérivés de l'entité NOTIFICATION du modèle de données (architecture.md, section 3,
 * ajoutée le 30 août 2026) — module Notifications, RF-020.
 *
 * `type` distingue les deux volets de RF-020 couverts par ce même mécanisme : US-20
 * (confirmation d'une réservation) et US-21 (rappel avant un créneau). Comme les autres statuts
 * du projet (`CreneauStatut`, `ReservationStatut`...), reste ouvert plutôt que figé en enum
 * strict : le backend pourrait introduire d'autres types de notifications (ex. RF-021 annulation,
 * Should have suivant) sans que ce type ait besoin d'être retouché à chaque fois.
 */
export type TypeNotification = 'confirmation_reservation' | 'rappel_creneau' | (string & {});

export interface Notification {
  id: string;
  /** `null` si la notification n'est pas liée à une réservation précise. */
  reservationId: string | null;
  type: TypeNotification;
  titre: string;
  message: string;
  lue: boolean;
  createdAt: string;
}
