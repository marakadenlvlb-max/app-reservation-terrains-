<?php

namespace App\Http\Resources\Annonces;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forme exacte de `Terrain` (packages/annonces-core/src/types.ts) : id, proprietaireId, sport,
 * adresse, latitude, longitude, type, equipements, photos, paliers, fraisAnnulationPourcentage
 * (RF-021, correction du 9 septembre 2026).
 */
class TerrainResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'proprietaireId' => $this->proprietaire_id,
            'sport' => $this->sport,
            'adresse' => $this->adresse,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'type' => $this->type,
            'equipements' => $this->equipements,
            'photos' => $this->photos,
            'fraisAnnulationPourcentage' => (float) $this->frais_annulation_pourcentage,
            'paliers' => $this->whenLoaded('paliers', fn () => $this->paliers->map(fn ($palier) => [
                'delaiMinutes' => $palier->delai_minutes,
                'pourcentageRemboursement' => (float) $palier->pourcentage_remboursement,
            ])->values()),
        ];
    }
}
