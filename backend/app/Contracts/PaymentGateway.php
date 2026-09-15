<?php

namespace App\Contracts;

use App\Models\Paiement;

/**
 * RF-011/RF-012/RF-013 : "adaptateur de paiement commun" décrit dans architecture.md section 4 —
 * une interface, trois implémentations (une par opérateur), pour isoler le reste de l'application
 * (InitierPaiement) des différences entre API. Voir config/paiement.php : les implémentations
 * livrées ici sont des adaptateurs de SIMULATION, pas de vraies intégrations Wave/Orange Money/
 * Moov Money (aucun identifiant disponible dans cet environnement).
 */
interface PaymentGateway
{
    /**
     * Initie le paiement chez l'opérateur et renvoie l'URL de la page de paiement à ouvrir —
     * `InitierPaiementResult.checkoutUrl` (packages/paiement-core/src/types.ts).
     */
    public function initierPaiement(Paiement $paiement): string;
}
