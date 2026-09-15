<?php

namespace App\Http\Resources\Messagerie;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forme exacte de `Message` (packages/messagerie-core/src/types.ts) : id, reservationId, contenu,
 * estDeMoi, createdAt. `estDeMoi` n'est pas une colonne — calculé ici par rapport à l'utilisateur
 * authentifié de la requête (même principe que `HistoriqueReservation.autrePartie`, mais dérivable
 * directement depuis `$request->user()` ici, sans avoir besoin d'un attribut dynamique posé sur le
 * modèle en amont).
 */
class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservationId' => $this->reservation_id,
            'contenu' => $this->contenu,
            'estDeMoi' => $this->auteur_id === $request->user()->id,
            'createdAt' => $this->created_at->toIso8601String(),
        ];
    }
}
