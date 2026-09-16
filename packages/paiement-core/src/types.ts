/**
 * Types dérivés de l'entité PAIEMENT du modèle de données (architecture.md, section 3) —
 * module Paiement.
 *
 * `Operateur` couvre les trois opérateurs imposés par le SRS (RF-011/012/013) : architecture.md
 * décrit une "interface commune (adaptateur de paiement)" derrière laquelle chaque opérateur est
 * une implémentation spécifique — un seul type et un seul composant générique
 * (PaiementOperateurBouton) servent donc aux trois, plutôt que du code dupliqué par opérateur.
 */
export type Operateur = 'wave' | 'orange_money' | 'moov_money';

export const OPERATEUR_LABELS: Record<Operateur, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
};

/** Les trois opérateurs Must have (RF-011/012/013) — utilisé pour afficher un bouton par opérateur sans les lister à la main à chaque écran. */
export const OPERATEURS: Operateur[] = ['wave', 'orange_money', 'moov_money'];

/**
 * Résultat de l'initiation d'un paiement — RF-011. `checkoutUrl` est l'hypothèse de contrat la
 * plus probable pour Wave (page de paiement hébergée à ouvrir), cohérente avec la note
 * d'architecture "endpoint webhook pour confirmation asynchrone" : le frontend n'apprend jamais
 * directement si le paiement a réussi, seulement où envoyer l'utilisateur pour payer — la
 * confirmation elle-même arrive par polling de la réservation (US-11), pas via ce retour.
 *
 * `montant`/`reductionParrainagePourcentage` : ajoutés le 9 septembre 2026 (point de transparence
 * signalé en session QA, rapport-qa.md) — un joueur dont le paiement bénéficie d'une réduction de
 * parrainage (US-26) n'avait auparavant aucun moyen de le constater dans l'app. `montant` reflète
 * ce qui est réellement facturé (net de la réduction le cas échéant) ; `reductionParrainagePourcentage`
 * vaut `null` quand aucune réduction n'a été appliquée, jamais `0` (qui laisserait croire à une
 * réduction nulle plutôt qu'à une absence de réduction).
 */
export interface InitierPaiementResult {
  paiementId: string;
  checkoutUrl: string;
  montant: number;
  reductionParrainagePourcentage: number | null;
}

/**
 * US-15 / RF-015 — reversement au propriétaire/gestionnaire. Dérivé des champs ajoutés à
 * PAIEMENT lors de la correction d'architecture du 30 août 2026 (`commission`, `montant_net`,
 * `statut_reversement`, `date_reversement`). `statutReversement` reste ouvert comme les autres
 * statuts du projet (`CreneauStatut`, `ReservationStatut`) : le modèle de données ne fige pas non
 * plus ses valeurs possibles.
 */
export type StatutReversement = 'en_attente' | 'effectue' | (string & {});

export interface Reversement {
  paiementId: string;
  reservationId: string;
  operateur: Operateur;
  /** Montant payé par le joueur, avant commission. */
  montant: number;
  commission: number;
  /** = montant − commission : ce que le propriétaire/gestionnaire touche réellement. */
  montantNet: number;
  statutReversement: StatutReversement;
  datePaiement: string;
  /** `null` tant que le reversement n'a pas encore eu lieu (statutReversement === 'en_attente'). */
  dateReversement: string | null;
}
