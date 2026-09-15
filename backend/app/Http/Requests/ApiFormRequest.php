<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Base commune à tous les Form Requests de l'API — voir Étape 2 du skill dev-laravel
 * (contrat de données) : chaque `*Api.ts` du frontend lit `body?.message` sur une réponse
 * d'erreur et l'affiche tel quel (ex. registerApi.ts, updateProfile...), jamais le tableau
 * `errors` imbriqué que Laravel renvoie par défaut sur un échec de validation (message
 * générique "The given data was invalid."). Sans cet override, un échec de validation afficherait
 * ce message générique à l'utilisateur au lieu du message de champ pourtant déjà écrit dans
 * `rules()`/`messages()` — un écart silencieux avec le contrat déjà vérifié en QA (ex. TC-001-06,
 * rapport-qa.md, qui attend "Cet email est déjà utilisé.", pas un message générique).
 */
abstract class ApiFormRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => $validator->errors()->first(),
            'errors' => $validator->errors(),
        ], 422));
    }
}
