<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\ReservationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Entité RESERVATION — architecture.md section 3, RF-010/RF-014.
 */
#[Fillable(['creneau_id', 'joueur_id', 'statut', 'montant'])]
class Reservation extends Model
{
    /** @use HasFactory<ReservationFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
        ];
    }

    public function creneau(): BelongsTo
    {
        return $this->belongsTo(Creneau::class);
    }

    public function joueur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'joueur_id');
    }

    /**
     * Utilisée par EnvoyerRappelsCreneaux (module Notifications, RF-020) pour ne jamais créer
     * deux rappels pour la même réservation.
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Utilisée par AnnulerReservation (module Réservation, RF-021) pour retrouver le paiement
     * validé à rembourser le cas échéant — une réservation peut avoir plusieurs lignes PAIEMENT
     * en base (tentatives échouées, cf. module Paiement) mais au plus une 'valide' à la fois.
     */
    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    /**
     * Conversation liée à cette réservation — module Messagerie, RF-023.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    /**
     * `expireA` n'est pas une colonne — voir le commentaire de la migration. Centralisé ici (pas
     * dupliqué entre l'Action et la Resource) : les deux en ont besoin pour la même raison
     * (RafraichirStatutReservation pour savoir si le verrou a expiré, ReservationResource pour
     * l'exposer au frontend).
     */
    public function expireA(): CarbonInterface
    {
        return $this->created_at->addMinutes((int) config('reservation.duree_verrou_minutes'));
    }
}
