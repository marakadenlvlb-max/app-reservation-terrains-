<?php

namespace App\Models;

use Database\Factories\NotationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Entité NOTATION — architecture.md section 3, RF-016/RF-017.
 */
#[Fillable(['reservation_id', 'auteur_id', 'cible_id', 'note', 'commentaire'])]
class Notation extends Model
{
    /** @use HasFactory<NotationFactory> */
    use HasFactory, HasUuids;

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }

    public function cible(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cible_id');
    }
}
