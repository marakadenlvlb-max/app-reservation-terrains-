<?php

namespace App\Http\Requests\Annonces;

use App\Http\Requests\ApiFormRequest;

/**
 * RF-006 — Création ET modification d'un créneau (packages/annonces-core/src/types.ts,
 * `UpdateCreneauPayload` a les mêmes champs que `CreateCreneauPayload` sans `terrainId`, qui vient
 * de la route plutôt que du corps de la requête). Format de date volontairement identique à
 * `DATETIME_REGEX` (validation.ts) : "AAAA-MM-JJTHH:MM", sans secondes ni fuseau.
 */
class CreneauRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'debut' => ['required', 'date_format:Y-m-d\TH:i'],
            'fin' => ['required', 'date_format:Y-m-d\TH:i', 'after:debut'],
            'tarif' => ['required', 'numeric', 'gt:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'debut.required' => 'Date et heure de début requises (format AAAA-MM-JJTHH:MM).',
            'debut.date_format' => 'Date et heure de début requises (format AAAA-MM-JJTHH:MM).',
            'fin.required' => 'Date et heure de fin requises (format AAAA-MM-JJTHH:MM).',
            'fin.date_format' => 'Date et heure de fin requises (format AAAA-MM-JJTHH:MM).',
            'fin.after' => 'La fin doit être après le début.',
            'tarif.required' => 'Le tarif doit être un nombre positif.',
            'tarif.numeric' => 'Le tarif doit être un nombre positif.',
            'tarif.gt' => 'Le tarif doit être un nombre positif.',
        ];
    }
}
