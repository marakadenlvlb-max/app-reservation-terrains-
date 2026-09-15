<?php

namespace App\Http\Resources\Annonces;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forme exacte de `Creneau` (packages/annonces-core/src/types.ts) : id, terrainId, debut, fin,
 * tarif, statut. `debut`/`fin` en ISO 8601 (le commentaire de `Creneau` dans types.ts est
 * explicite : "jamais un objet Date").
 */
class CreneauResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'terrainId' => $this->terrain_id,
            'debut' => $this->debut->toIso8601String(),
            'fin' => $this->fin->toIso8601String(),
            'tarif' => (float) $this->tarif,
            'statut' => $this->statut,
        ];
    }
}
