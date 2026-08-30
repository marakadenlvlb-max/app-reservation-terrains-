/**
 * Types dérivés de l'entité MESSAGE du modèle de données (architecture.md, section 3, ajoutée le
 * 30 août 2026) — module Messagerie, RF-023.
 *
 * `estDeMoi` n'est PAS un champ de MESSAGE dans architecture.md (qui ne liste que reservation_id,
 * auteur_id, contenu, created_at) : c'est une projection calculée côté backend selon qui
 * interroge l'API (le backend connaît déjà l'utilisateur authentifié) — même principe que
 * `HistoriqueReservation.autrePartie` (module Historique). Évite au frontend de devoir récupérer
 * son propre id séparément juste pour aligner les bulles de conversation.
 */
export interface Message {
  id: string;
  reservationId: string;
  contenu: string;
  estDeMoi: boolean;
  createdAt: string;
}
