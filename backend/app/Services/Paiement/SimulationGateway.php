<?php

namespace App\Services\Paiement;

use App\Contracts\PaymentGateway;
use App\Models\Paiement;

/**
 * Base commune aux trois adaptateurs de simulation (WaveGateway, OrangeMoneyGateway,
 * MoovMoneyGateway) — voir config/paiement.php pour l'explication de ce mode. Regroupée ici pour
 * ne pas dupliquer la construction de l'URL de simulation trois fois ; chaque sous-classe ne fait
 * que se nommer, ce qui reste le seul point qui variera vraiment une fois une vraie intégration
 * branchée à la place (chaque opérateur remplacera sa propre sous-classe indépendamment des deux
 * autres).
 */
abstract class SimulationGateway implements PaymentGateway
{
    abstract protected function operateur(): string;

    public function initierPaiement(Paiement $paiement): string
    {
        // URL interne, jamais celle d'un vrai opérateur — voir config/paiement.php. `APP_URL`
        // plutôt qu'un domaine en dur pour rester cohérent quel que soit l'environnement.
        return sprintf(
            '%s/simulation-paiement/%s/%s',
            rtrim(config('app.url'), '/'),
            $this->operateur(),
            $paiement->id
        );
    }
}
