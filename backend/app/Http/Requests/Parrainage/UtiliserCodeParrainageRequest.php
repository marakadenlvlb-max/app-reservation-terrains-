<?php

namespace App\Http\Requests\Parrainage;

use App\Http\Requests\ApiFormRequest;

/**
 * RF-025 — contrat exact de utiliserCodeParrainage (parrainageApi.ts) : { code }.
 */
class UtiliserCodeParrainageRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Saisis un code de parrainage.',
        ];
    }
}
