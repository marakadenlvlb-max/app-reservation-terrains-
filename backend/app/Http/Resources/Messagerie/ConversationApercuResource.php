<?php

namespace App\Http\Resources\Messagerie;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forme exacte de `ConversationApercu` (packages/messagerie-core/src/types.ts, US-27/US-28) :
 * reservationId, terrain { id, sport, adresse }, autrePartie { id, nom }, dernierMessage
 * { contenu, createdAt } | null. `autre_partie`/`dernier_message` : propriétés dynamiques posées
 * par ObtenirMesConversations, pas des colonnes — même principe que
 * HistoriqueReservationResource.
 */
class ConversationApercuResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'reservationId' => $this->id,
            'terrain' => [
                'id' => $this->creneau->terrain->id,
                'sport' => $this->creneau->terrain->sport,
                'adresse' => $this->creneau->terrain->adresse,
            ],
            'autrePartie' => [
                'id' => $this->autre_partie->id,
                'nom' => $this->autre_partie->nom,
            ],
            'dernierMessage' => $this->dernier_message ? [
                'contenu' => $this->dernier_message->contenu,
                'createdAt' => $this->dernier_message->created_at->toIso8601String(),
            ] : null,
        ];
    }
}
