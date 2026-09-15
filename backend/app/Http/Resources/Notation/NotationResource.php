<?php

namespace App\Http\Resources\Notation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forme exacte de `Notation` (packages/notation-core/src/types.ts) : id, reservationId,
 * auteurId, cibleId, note, commentaire, createdAt.
 */
class NotationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservationId' => $this->reservation_id,
            'auteurId' => $this->auteur_id,
            'cibleId' => $this->cible_id,
            'note' => $this->note,
            'commentaire' => $this->commentaire,
            'createdAt' => $this->created_at->toIso8601String(),
        ];
    }
}
