<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Durée du verrouillage temporaire (RF-010)
    |--------------------------------------------------------------------------
    |
    | TODO métier : valeur à confirmer — ni le SRS, ni architecture.md, ni backlog.md (US-10) ne
    | fixent de durée chiffrée pour le verrou temporaire d'un créneau. `Reservation.expireA`
    | (packages/reservation-core/src/types.ts) est explicitement documenté côté frontend comme une
    | hypothèse ("le backend peut le calculer à la volée... à confirmer avec le contrat d'API réel
    | une fois le backend implémenté") : 15 minutes est un choix technique provisoire et courant
    | pour ce genre de verrou (le temps de finaliser un paiement mobile money), pas une règle
    | métier tranchée par le projet — à ajuster explicitement si une valeur différente est décidée.
    |
    */
    'duree_verrou_minutes' => env('RESERVATION_DUREE_VERROU_MINUTES', 15),

    /*
    |--------------------------------------------------------------------------
    | Politique d'annulation (RF-021, US-22)
    |--------------------------------------------------------------------------
    |
    | Le seuil unique de 24h envisagé initialement a été abandonné le 9 septembre 2026 : RF-021
    | est en fait une politique entièrement configurable par chaque propriétaire, par terrain
    | (voir l'entité PALIER_ANNULATION, architecture.md section 3, et Terrain::paliers()). Il n'y
    | a donc plus de délai global ici — chaque terrain porte ses propres paliers, et un terrain ne
    | peut plus être publié sans en avoir configuré au moins un (TerrainRequest).
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Barème dégressif des frais de transaction par défaut (RF-021, US-22)
    |--------------------------------------------------------------------------
    |
    | `TERRAIN.frais_annulation_pourcentage` (distinct des paliers ci-dessus) est individuel par
    | terrain, pas global au propriétaire — mais sa valeur PAR DÉFAUT (tant que le propriétaire ne
    | la remplace pas explicitement) dépend du nombre total de terrains qu'il possède, selon ce
    | barème dégressif fourni explicitement par le porteur de projet le 9 septembre 2026 (pas une
    | intuition) : plus un propriétaire a de terrains, plus le taux appliqué à un remboursement
    | est bas. Chaque ligne se lit "jusqu'à `max_terrains` terrains inclus → `pourcentage`" ; la
    | dernière ligne (`max_terrains` = null) couvre "10 terrains et plus".
    |
    | TODO métier : les VALEURS de ce barème restent explicitement provisoires (aucun taux réel
    | négocié avec Wave/Orange Money/Moov Money dans cet environnement — même limite que
    | config/paiement.php) ; la STRUCTURE (barème dégressif par nombre de terrains) est en
    | revanche une décision produit ferme, pas à deviner. Voir AttribuerFraisAnnulationDefaut.
    |
    */
    'bareme_frais_annulation_defaut' => [
        ['max_terrains' => 1, 'pourcentage' => 2],
        ['max_terrains' => 2, 'pourcentage' => 1.5],
        ['max_terrains' => 3, 'pourcentage' => 1],
        ['max_terrains' => 7, 'pourcentage' => 0.7],
        ['max_terrains' => 9, 'pourcentage' => 0.5],
        ['max_terrains' => null, 'pourcentage' => 0.3],
    ],

];
