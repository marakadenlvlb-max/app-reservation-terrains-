<?php

namespace App\Console\Commands;

use App\Actions\Notification\EnvoyerRappelsCreneaux;
use Illuminate\Console\Command;

/**
 * RF-020 — Tâche planifiée qui crée les notifications de rappel (voir EnvoyerRappelsCreneaux
 * pour la logique). Ne délivre rien elle-même (pas de push/email/SMS, hors périmètre — même
 * limite que Wave/Orange Money/Moov Money, aucun service tiers accessible ici) : elle alimente
 * uniquement le journal que GET /api/notifications expose déjà.
 */
class EnvoyerRappelsCreneauxCommand extends Command
{
    protected $signature = 'notifications:rappels-creneaux';

    protected $description = 'Crée les notifications de rappel pour les créneaux qui approchent (RF-020)';

    public function handle(EnvoyerRappelsCreneaux $action): int
    {
        $nombre = $action->handle();
        $this->info("{$nombre} rappel(s) de créneau créé(s).");

        return self::SUCCESS;
    }
}
