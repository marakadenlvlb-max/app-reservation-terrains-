<?php

namespace App\Services\Paiement;

use App\Contracts\PaymentGateway;
use InvalidArgumentException;

/**
 * Résout l'adaptateur à utiliser pour un `operateur` donné — `Operateur`
 * (packages/paiement-core/src/types.ts) fixe déjà les trois valeurs possibles ('wave',
 * 'orange_money', 'moov_money'), validées en amont par InitierPaiementRequest ; le
 * `InvalidArgumentException` ci-dessous est donc un garde-fou de dernier recours, pas un chemin
 * censé être atteint en usage normal.
 */
class PaymentGatewayResolver
{
    public function pour(string $operateur): PaymentGateway
    {
        return match ($operateur) {
            'wave' => app(WaveGateway::class),
            'orange_money' => app(OrangeMoneyGateway::class),
            'moov_money' => app(MoovMoneyGateway::class),
            default => throw new InvalidArgumentException("Opérateur inconnu : {$operateur}"),
        };
    }
}
