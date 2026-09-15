<?php

namespace App\Http\Requests\Reservation;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

/**
 * RF-010 — Le seul champ envoyé par initierReservation (reservationApi.ts) est `creneauId` : le
 * montant se dérive du tarif du créneau côté backend (InitierReservation), jamais saisi par le
 * frontend.
 */
class InitierReservationRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'creneauId' => ['required', 'string', Rule::exists('creneaux', 'id')],
        ];
    }

    public function messages(): array
    {
        return [
            'creneauId.exists' => "Ce créneau n'existe pas ou plus.",
        ];
    }
}
