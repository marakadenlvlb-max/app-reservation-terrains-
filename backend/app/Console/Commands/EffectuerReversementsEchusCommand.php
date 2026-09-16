<?php

namespace App\Console\Commands;

use App\Actions\Paiement\EffectuerReversementsEchus;
use Illuminate\Console\Command;

/**
 * RF-015 — Tâche planifiée qui referme les reversements laissés `'en_attente'` une fois leur
 * créneau commencé (voir EffectuerReversementsEchus pour la logique et le pourquoi du seuil).
 */
class EffectuerReversementsEchusCommand extends Command
{
    protected $signature = 'paiements:reverser-echus';

    protected $description = "Marque 'effectué' les reversements en attente dont le créneau a commencé (RF-015)";

    public function handle(EffectuerReversementsEchus $action): int
    {
        $nombre = $action->handle();
        $this->info("{$nombre} reversement(s) marqué(s) effectué(s).");

        return self::SUCCESS;
    }
}
