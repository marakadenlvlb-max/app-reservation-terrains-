<?php

namespace App\Models;

use Database\Factories\NotificationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Entité NOTIFICATION — architecture.md section 3, RF-020. Nommé `App\Models\Notification`
 * (comme l'entité elle-même) plutôt qu'un nom détourné pour éviter toute confusion avec le
 * système de notifications intégré de Laravel (`Illuminate\Notifications\Notification`,
 * espace de noms différent, jamais utilisé dans ce projet) — les deux ne se recouvrent pas.
 */
#[Fillable(['destinataire_id', 'reservation_id', 'type', 'titre', 'message', 'lue'])]
class Notification extends Model
{
    /** @use HasFactory<NotificationFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'lue' => 'boolean',
        ];
    }

    public function destinataire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'destinataire_id');
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
