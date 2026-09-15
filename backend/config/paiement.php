<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Mode simulation — LIMITE SIGNALÉE, PAS UNE DÉCISION MÉTIER
    |--------------------------------------------------------------------------
    |
    | Aucun identifiant/sandbox Wave, Orange Money ou Moov Money n'est disponible dans cet
    | environnement de développement (déjà noté en session QA, rapport-qa.md, 1 septembre 2026).
    | Les trois classes de app/Services/Paiement/ (WaveGateway, OrangeMoneyGateway,
    | MoovMoneyGateway) sont donc des ADAPTATEURS DE SIMULATION : elles respectent l'interface
    | PaymentGateway et le contrat déjà consommé par le frontend (InitierPaiementResult :
    | { paiementId, checkoutUrl }), mais ne contactent aucune vraie API d'opérateur — le
    | `checkoutUrl` renvoyé pointe vers une page de simulation interne, pas vers Wave/OM/Moov.
    | Chaque opérateur devra être branché sur sa vraie API avant mise en production, une fois des
    | identifiants réels disponibles ; la forme du webhook ci-dessous (signature par secret
    | partagé, payload { paiementId, statut }) est elle aussi un choix provisoire, à confronter à
    | la vraie documentation de chaque opérateur.
    |
    */
    'simulation' => env('PAIEMENT_MODE_SIMULATION', true),

    'webhook_secrets' => [
        'wave' => env('PAIEMENT_WEBHOOK_SECRET_WAVE'),
        'orange_money' => env('PAIEMENT_WEBHOOK_SECRET_ORANGE_MONEY'),
        'moov_money' => env('PAIEMENT_WEBHOOK_SECRET_MOOV_MONEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Commission et cycle de reversement (RF-015)
    |--------------------------------------------------------------------------
    |
    | RF-015 ("reverser... moins la commission éventuelle... selon un cycle de reversement
    | défini") a été explicitement tranché par le porteur de projet le 9 septembre 2026, faute de
    | valeur/règle dans le SRS — pas une intuition :
    |
    | - Commission de 10% prélevée sur chaque paiement validé, valeur PROVISOIRE explicitement
    |   signalée comme telle (aucune grille tarifaire réelle négociée) — à ajuster si une autre
    |   valeur est décidée. Voir TraiterWebhookPaiement.
    | - Cycle IMMÉDIAT : le reversement (statut_reversement → 'effectue') est marqué effectué dans
    |   la même opération que la confirmation du paiement (RF-014), pas différé à une tâche
    |   planifiée groupée — choix le plus simple à opérer/tester, cohérent avec l'absence d'un
    |   vrai mécanisme de virement groupé dans ce dépôt.
    |
    | ⚠️ Limite assumée, distincte de la décision elle-même : comme pour les trois opérateurs de
    | paiement, AUCUN virement réel n'a jamais lieu ici (pas d'API de payout Wave/Orange Money/Moov
    | Money intégrée) — "reversé" ne fait que marquer une ligne en base, une simulation au même
    | titre que `paiement.simulation` ci-dessus. Conséquence à surveiller avant toute mise en
    | production réelle : un reversement marqué immédiatement "effectué" puis suivi d'une
    | annulation remboursée (RF-021, AnnulerReservation) crée un risque de double versement (le
    | propriétaire garde le reversement pendant que le joueur est remboursé) — aucun mécanisme de
    | recouvrement n'existe pour ce cas ici, à concevoir avant un vrai lancement.
    |
    */
    'commission_pourcentage' => env('PAIEMENT_COMMISSION_POURCENTAGE', 10),

];
