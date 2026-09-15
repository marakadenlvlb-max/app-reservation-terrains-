<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// RF-020 — voir EnvoyerRappelsCreneauxCommand. Toutes les 15 minutes : assez fréquent pour rester
// proche de `notification.delai_rappel_heures`, sans valeur imposée par le SRS non plus — la
// tâche est idempotente (EnvoyerRappelsCreneaux), donc la fréquence exacte n'a pas d'incidence
// sur la justesse du résultat, seulement sur la latence entre l'approche du créneau et le rappel.
Schedule::command('notifications:rappels-creneaux')->everyFifteenMinutes();
