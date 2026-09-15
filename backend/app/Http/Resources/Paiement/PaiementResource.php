<?php

namespace App\Http\Resources\Paiement;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Accusé de réception renvoyé à l'opérateur après traitement du webhook (WebhookPaiementController)
 * — aucun contrat frontend à respecter ici (l'appelant est l'opérateur, pas packages/*-core), la
 * forme reste néanmoins cohérente (camelCase) avec le reste de l'API.
 */
class PaiementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservationId' => $this->reservation_id,
            'operateur' => $this->operateur,
            'statut' => $this->statut,
        ];
    }
}
