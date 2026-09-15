<?php

namespace App\Services\Paiement;

/**
 * RF-012 — Adaptateur Orange Money. Simulation (voir SimulationGateway/config/paiement.php) : à
 * remplacer par un vrai appel à l'API Orange Money une fois des identifiants disponibles.
 */
class OrangeMoneyGateway extends SimulationGateway
{
    protected function operateur(): string
    {
        return 'orange_money';
    }
}
