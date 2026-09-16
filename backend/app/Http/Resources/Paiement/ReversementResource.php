<?php

namespace App\Http\Resources\Paiement;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forme exacte de `Reversement` (packages/paiement-core/src/types.ts).
 *
 * `commission`/`montantNet` sont calculés et renseignés réellement par `TraiterWebhookPaiement` dès
 * la confirmation du paiement (commission tranchée par le porteur de projet le 9 septembre 2026).
 * `statutReversement` reste `'en_attente'` à ce stade (cycle revu le 16 septembre 2026, voir
 * `config/paiement.php`) : c'est désormais un état normal et attendu, pas seulement transitoire —
 * `EffectuerReversementsEchus` le passe à `'effectue'` une fois le créneau commencé. Le repli
 * `?? 'en_attente'` couvre en plus un paiement qui n'aurait pas transité par ce flux (ex. créé
 * directement en base dans un test) — `statutReversement` n'est jamais `null` côté frontend
 * (`StatutReversement`, types.ts), donc ce champ ne peut de toute façon jamais rester vide.
 */
class ReversementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'paiementId' => $this->id,
            'reservationId' => $this->reservation_id,
            'operateur' => $this->operateur,
            'montant' => (float) $this->montant,
            'commission' => $this->commission !== null ? (float) $this->commission : null,
            'montantNet' => $this->montant_net !== null ? (float) $this->montant_net : null,
            'statutReversement' => $this->statut_reversement ?? 'en_attente',
            'datePaiement' => $this->date_paiement?->toIso8601String(),
            'dateReversement' => $this->date_reversement?->toIso8601String(),
        ];
    }
}
