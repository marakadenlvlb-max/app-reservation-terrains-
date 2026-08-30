/**
 * Types dérivés de l'entité PARRAINAGE et du champ UTILISATEUR.code_parrainage du modèle de
 * données (architecture.md, section 3, ajoutés le 30 août 2026) — module Parrainage, RF-025.
 *
 * `statut` reste `string` ouvert plutôt qu'un enum fermé, comme les autres statuts du projet
 * (`ReservationStatut`, `CreneauStatut`...) : le backend reste seul juge des valeurs possibles
 * (ex. 'en_attente' avant que le filleul n'ait rempli une condition d'activation, 'valide' une
 * fois l'avantage accordé).
 */
export type StatutParrainage = 'en_attente' | 'valide' | (string & {});

/** Un filleul déjà parrainé, du point de vue du parrain — RF-025 ("suivre les bénéfices associés"). */
export interface Filleul {
  id: string;
  nom: string;
  statut: StatutParrainage;
  /** `null` tant qu'aucun avantage n'a encore été accordé (ex. statut encore 'en_attente'). */
  avantage: string | null;
  createdAt: string;
}

/**
 * Vue combinée renvoyée par l'API : le code à partager (propre à l'utilisateur connecté, dérivé
 * de `UTILISATEUR.code_parrainage`) et la liste de ses filleuls déjà parrainés — tout ce dont
 * RF-025 a besoin en une seule requête.
 */
export interface ParrainageResume {
  codeParrainage: string;
  filleuls: Filleul[];
}
