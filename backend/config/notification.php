<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Délai avant le rappel de créneau (RF-020)
    |--------------------------------------------------------------------------
    |
    | TODO métier : valeur à confirmer — RF-020 dit "rappeler au joueur son créneau à l'approche
    | de l'horaire réservé" sans préciser de délai chiffré, et ni le SRS ni architecture.md ni
    | backlog.md n'en fixent un. 2 heures est un choix technique provisoire (même statut que
    | `reservation.duree_verrou_minutes`, US-10) — à ajuster explicitement le jour où une vraie
    | valeur est décidée, pas une règle métier tranchée ici.
    |
    */
    'delai_rappel_heures' => env('NOTIFICATION_DELAI_RAPPEL_HEURES', 2),

];
