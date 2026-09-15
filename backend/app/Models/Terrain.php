<?php

namespace App\Models;

use Database\Factories\TerrainFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Entité TERRAIN — architecture.md section 3, RF-004/RF-005.
 */
#[Fillable(['proprietaire_id', 'sport', 'adresse', 'latitude', 'longitude', 'type', 'equipements', 'photos', 'frais_annulation_pourcentage'])]
class Terrain extends Model
{
    /** @use HasFactory<TerrainFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'equipements' => 'array',
            'photos' => 'array',
            'latitude' => 'float',
            'longitude' => 'float',
            'frais_annulation_pourcentage' => 'decimal:2',
        ];
    }

    public function proprietaire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'proprietaire_id');
    }

    public function creneaux(): HasMany
    {
        return $this->hasMany(Creneau::class);
    }

    /**
     * RF-021 (correction du 9 septembre 2026) — la politique d'annulation configurable par
     * palier. Ordonnés du délai le plus long au plus court : AnnulerReservation retrouve ainsi le
     * premier palier respecté sans avoir à retrier la collection à chaque appel.
     */
    public function paliers(): HasMany
    {
        return $this->hasMany(PalierAnnulation::class)->orderByDesc('delai_minutes');
    }
}
