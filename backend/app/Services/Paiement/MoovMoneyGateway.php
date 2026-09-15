<?php

namespace App\Services\Paiement;

/**
 * RF-013 — Adaptateur Moov Money. Simulation (voir SimulationGateway/config/paiement.php) : à
 * remplacer par un vrai appel à l'API Moov Money une fois des identifiants disponibles.
 */
class MoovMoneyGateway extends SimulationGateway
{
    protected function operateur(): string
    {
        return 'moov_money';
    }
}
