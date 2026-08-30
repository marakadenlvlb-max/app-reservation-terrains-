/**
 * Types dérivés de l'entité NOTATION du modèle de données (architecture.md, section 3) —
 * US-16 / RF-016.
 *
 * `note` est une échelle 1 à 5 : ni le SRS ni architecture.md ne fixent l'échelle exacte (le
 * champ est juste `int note`), 1-5 est le standard le plus courant pour ce type de notation et
 * cohérent avec l'affichage "X,X / 5" déjà utilisé pour `proprietaireNoteMoyenne` dans le détail
 * d'annonce (US-08, @app/recherche-core) — à confirmer avec le backend le cas échéant.
 */
export const NOTE_MIN = 1;
export const NOTE_MAX = 5;

export interface CreateNotationPayload {
  reservationId: string;
  cibleId: string;
  note: number;
  /** Optionnel — RF-016 : "avec une note et un commentaire optionnel". */
  commentaire?: string;
}

export interface Notation {
  id: string;
  reservationId: string;
  auteurId: string;
  cibleId: string;
  note: number;
  commentaire: string | null;
  createdAt: string;
}

/**
 * US-17 / RF-017 — note moyenne d'un profil, calculée côté backend à partir des NOTATION reçues.
 * `nombreAvis` permet d'afficher "4,5/5 (12 avis)" plutôt qu'un chiffre nu, et de distinguer une
 * vraie moyenne basse d'une absence d'avis (voir `moyenne: null`).
 */
export interface NoteMoyenne {
  utilisateurId: string;
  moyenne: number | null;
  nombreAvis: number;
}
