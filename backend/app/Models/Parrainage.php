<?php

namespace App\Models;

use Database\Factories\ParrainageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Entité PARRAINAGE — architecture.md section 3, RF-025.
 */
#[Fillable(['parrain_id', 'filleul_id', 'statut', 'avantage', 'reduction_pourcentage', 'paiement_id'])]
class Parrainage extends Model
{
    /** @use HasFactory<ParrainageFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'reduction_pourcentage' => 'decimal:2',
        ];
    }

    public function parrain(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parrain_id');
    }

    public function filleul(): BelongsTo
    {
        return $this->belongsTo(User::class, 'filleul_id');
    }

    public function paiement(): BelongsTo
    {
        return $this->belongsTo(Paiement::class);
    }
}
