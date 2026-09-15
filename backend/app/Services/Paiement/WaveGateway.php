<?php

namespace App\Services\Paiement;

/**
 * RF-011 — Adaptateur Wave. Simulation (voir SimulationGateway/config/paiement.php) : à
 * remplacer par un vrai appel à l'API Wave Checkout une fois des identifiants disponibles.
 */
class WaveGateway extends SimulationGateway
{
    protected function operateur(): string
    {
        return 'wave';
    }
}
