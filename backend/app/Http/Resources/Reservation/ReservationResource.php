<?php

namespace App\Http\Resources\Reservation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forme exacte de `Reservation` (packages/reservation-core/src/types.ts) : id, creneauId,
 * joueurId, statut, montant, createdAt, expireA (calculé — voir Reservation::expireA()).
 */
class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'creneauId' => $this->creneau_id,
            'joueurId' => $this->joueur_id,
            'statut' => $this->statut,
            'montant' => (float) $this->montant,
            'createdAt' => $this->created_at->toIso8601String(),
            'expireA' => $this->expireA()->toIso8601String(),
        ];
    }
}
