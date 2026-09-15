<?php

namespace App\Http\Requests\Paiement;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

/**
 * RF-011/RF-012/RF-013 — Contrat exact de initierPaiement (paiementApi.ts) :
 * { reservationId, operateur }.
 */
class InitierPaiementRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reservationId' => ['required', 'string', Rule::exists('reservations', 'id')],
            // Operateur (types.ts) fixe les trois valeurs Must have du SRS — pas de "autre"
            // ouvert ici, contrairement à ReservationStatut/CreneauStatut qui restent des
            // chaînes ouvertes côté frontend.
            'operateur' => ['required', 'string', Rule::in(['wave', 'orange_money', 'moov_money'])],
        ];
    }

    public function messages(): array
    {
        return [
            'reservationId.exists' => "Cette réservation n'existe pas.",
        ];
    }
}
