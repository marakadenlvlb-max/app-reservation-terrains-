<?php

namespace App\Models;

use Database\Factories\PaiementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Entité PAIEMENT — architecture.md section 3, RF-011/RF-012/RF-013/RF-014 (initiation et
 * confirmation) et RF-015 (`commission`/`montant_net`/`statut_reversement`/`date_reversement`,
 * calculés par TraiterWebhookPaiement — voir config/paiement.php pour le taux et le cycle
 * tranchés le 9 septembre 2026).
 */
#[Fillable(['reservation_id', 'operateur', 'statut', 'montant', 'reference_externe', 'date_paiement', 'commission', 'montant_net', 'statut_reversement', 'date_reversement'])]
class Paiement extends Model
{
    /** @use HasFactory<PaiementFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'commission' => 'decimal:2',
            'montant_net' => 'decimal:2',
            'date_paiement' => 'datetime',
            'date_reversement' => 'datetime',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
