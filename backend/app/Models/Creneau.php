<?php

namespace App\Models;

use Database\Factories\CreneauFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Entité CRENEAU — architecture.md section 3, RF-006.
 */
#[Fillable(['terrain_id', 'debut', 'fin', 'tarif', 'statut'])]
class Creneau extends Model
{
    /** @use HasFactory<CreneauFactory> */
    use HasFactory, HasUuids;

    // Eloquent pluralise "Creneau" en "Creneaus" (règles anglaises) au lieu de "creneaux" (le nom
    // de table réellement migré, cf. la migration) — nom de table explicite pour éviter le piège.
    protected $table = 'creneaux';

    protected function casts(): array
    {
        return [
            'debut' => 'datetime',
            'fin' => 'datetime',
            'tarif' => 'decimal:2',
        ];
    }

    public function terrain(): BelongsTo
    {
        return $this->belongsTo(Terrain::class);
    }
}
