<?php

namespace App\Actions\Parrainage;

use App\Models\Parrainage;
use App\Models\User;

/**
 * RF-025 — rattache l'utilisateur connecté comme filleul du détenteur du code fourni. Activation
 * immédiate (statut 'valide' dès l'usage, pas d'état 'en_attente' intermédiaire) et bénéficiaire
 * (le parrain, pas le filleul) : décisions explicites du porteur de projet du 9 septembre 2026,
 * faute de précision dans le SRS — voir config/parrainage.php.
 */
class UtiliserCodeParrainage
{
    public function handle(User $filleul, string $code): Parrainage
    {
        $parrain = User::where('code_parrainage', strtoupper(trim($code)))->first();

        if (! $parrain) {
            abort(422, 'Ce code de parrainage est invalide.');
        }

        if ($parrain->id === $filleul->id) {
            abort(422, 'Tu ne peux pas utiliser ton propre code de parrainage.');
        }

        // UTILISATEUR ||--o| PARRAINAGE : est_filleul (architecture.md section 3) — un filleul
        // n'a par construction qu'au plus une ligne PARRAINAGE, contrainte unique en base.
        if (Parrainage::where('filleul_id', $filleul->id)->exists()) {
            abort(409, 'Tu as déjà utilisé un code de parrainage.');
        }

        $pourcentage = (float) config('parrainage.reduction_pourcentage');

        return Parrainage::create([
            'parrain_id' => $parrain->id,
            'filleul_id' => $filleul->id,
            'statut' => 'valide',
            'avantage' => "{$pourcentage}% de réduction sur ta prochaine réservation.",
            'reduction_pourcentage' => $pourcentage,
        ]);
    }
}
