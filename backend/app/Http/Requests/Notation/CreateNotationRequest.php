<?php

namespace App\Http\Requests\Notation;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

/**
 * RF-016 — Contrat exact de creerNotation (notationApi.ts) : reservationId, cibleId, note
 * (requise), commentaire (optionnel). L'échelle 1-5 (NOTE_MIN/NOTE_MAX, types.ts) est une
 * hypothèse déjà assumée côté frontend faute d'échelle chiffrée dans le SRS — reprise telle
 * quelle, pas une règle inventée ici pour la première fois.
 */
class CreateNotationRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reservationId' => ['required', 'string', Rule::exists('reservations', 'id')],
            'cibleId' => ['required', 'string', Rule::exists('users', 'id')],
            'note' => ['required', 'integer', 'between:1,5'],
            'commentaire' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'note.required' => 'Sélectionne une note entre 1 et 5.',
            'note.between' => 'Sélectionne une note entre 1 et 5.',
        ];
    }
}
