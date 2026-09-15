<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Taux de réduction accordé au parrain (RF-025, US-26)
    |--------------------------------------------------------------------------
    |
    | RF-025 ("suivre les bénéfices associés") ne précise ni le bénéficiaire ni le taux — décidé
    | explicitement par le porteur de projet le 9 septembre 2026, faute de valeur dans le SRS :
    | le PARRAIN (pas le filleul) reçoit une réduction à usage unique sur sa prochaine réservation,
    | consommée dès qu'un paiement l'utilise (voir InitierPaiement). 10% est une valeur ronde
    | fournie comme point de départ, explicitement provisoire — à ajuster si une autre valeur est
    | décidée. Capturée sur chaque ligne PARRAINAGE au moment de l'activation (pas relue ici à la
    | consommation) : un changement futur de ce taux ne doit pas affecter rétroactivement une
    | récompense déjà accordée.
    |
    */
    'reduction_pourcentage' => env('PARRAINAGE_REDUCTION_POURCENTAGE', 10),

];
