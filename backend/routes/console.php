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

// RF-015 (cycle de reversement revu le 16 septembre 2026) — voir EffectuerReversementsEchusCommand.
// Même cadence que les rappels ci-dessus : la tâche est idempotente
// (EffectuerReversementsEchus ne touche que les paiements encore 'en_attente'), donc la fréquence
// exacte n'a d'incidence que sur le délai entre le début du créneau et le passage à "effectué".
Schedule::command('paiements:reverser-echus')->everyFifteenMinutes();
