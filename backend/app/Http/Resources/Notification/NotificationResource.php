<?php

namespace App\Http\Resources\Notification;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forme exacte de `Notification` (packages/notification-core/src/types.ts) : id, reservationId,
 * type, titre, message, lue, createdAt.
 */
class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservationId' => $this->reservation_id,
            'type' => $this->type,
            'titre' => $this->titre,
            'message' => $this->message,
            'lue' => $this->lue,
            'createdAt' => $this->created_at->toIso8601String(),
        ];
    }
}
