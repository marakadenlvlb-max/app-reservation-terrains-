<?php

namespace App\Http\Requests\Authentification;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

/**
 * RF-003 — Édition du profil. Reprend exactement validateProfilePayload (validation.ts) : nom et
 * au moins un sport requis, ville volontairement optionnelle (le SRS ne l'impose pas).
 */
class UpdateProfileRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        // auth:sanctum protège déjà la route (routes/api.php) — un utilisateur connecté ne
        // modifie que son propre profil, il n'y a pas de "profil d'un autre" à autoriser ici.
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'ville' => ['nullable', 'string', 'max:255'],
            'sports' => ['required', 'array', 'min:1'],
            'sports.*' => ['required', 'string', Rule::in(['foot', 'tennis', 'basket'])],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est requis pour être identifiable par les autres utilisateurs.',
            // .required ET .min : un tableau vide échoue sur `required` avant `min:1` (voir la
            // même note dans RegisterRequest).
            'sports.required' => 'Sélectionne au moins un sport pratiqué.',
            'sports.min' => 'Sélectionne au moins un sport pratiqué.',
        ];
    }
}
