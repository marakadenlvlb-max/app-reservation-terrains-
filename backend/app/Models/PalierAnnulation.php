<?php

namespace App\Models;

use Database\Factories\PalierAnnulationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Entité PALIER_ANNULATION — architecture.md section 3, RF-021 (correction du 9 septembre 2026).
 */
#[Fillable(['terrain_id', 'delai_minutes', 'pourcentage_remboursement'])]
class PalierAnnulation extends Model
{
    /** @use HasFactory<PalierAnnulationFactory> */
    use HasFactory, HasUuids;

    // Eloquent pluralise "PalierAnnulation" en "palier_annulations" (règles anglaises) au lieu de
    // "paliers_annulation" (le nom de table réellement migré) — même piège déjà rencontré sur
    // Creneau (voir dev-laravel/SKILL.md), nom de table explicite pour l'éviter.
    protected $table = 'paliers_annulation';

    protected function casts(): array
    {
        return [
            'delai_minutes' => 'integer',
            'pourcentage_remboursement' => 'decimal:2',
        ];
    }

    public function terrain(): BelongsTo
    {
        return $this->belongsTo(Terrain::class);
    }
}
