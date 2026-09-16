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
import type { Sport } from '@app/shared';

export interface Message {
  id: string;
  reservationId: string;
  contenu: string;
  estDeMoi: boolean;
  createdAt: string;
}

/**
 * US-27 (module Navigation & Interface globale — "Messagerie") : aperçu d'une conversation pour
 * une page de liste. Jusqu'ici la messagerie ne s'atteignait que depuis une réservation précise
 * (HistoriqueList) — aucune vue d'ensemble "mes conversations" n'existait, ni ce type pour la
 * représenter. Volontairement minimal (pas de compteur de non-lus : RF-023 ne prévoit pas de
 * distinction lu/non-lu sur MESSAGE dans architecture.md, contrairement à NOTIFICATION).
 */
export interface ConversationApercu {
  reservationId: string;
  terrain: {
    id: string;
    sport: Sport;
    adresse: string;
  };
  autrePartie: {
    id: string;
    nom: string;
  };
  dernierMessage: {
    contenu: string;
    createdAt: string;
  } | null;
}
