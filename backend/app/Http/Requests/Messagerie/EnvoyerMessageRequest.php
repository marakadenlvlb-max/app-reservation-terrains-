<?php

namespace App\Http\Requests\Messagerie;

use App\Http\Requests\ApiFormRequest;

/**
 * RF-023 — contrat exact de envoyerMessage (messagerieApi.ts) : { contenu }. 2000 caractères est
 * une limite technique raisonnable contre l'abus (aucune longueur maximale n'est imposée par le
 * SRS), pas une règle métier — même statut que le throttle sur les routes d'authentification.
 */
class EnvoyerMessageRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contenu' => ['required', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'contenu.required' => 'Écris un message avant de l\'envoyer.',
            'contenu.max' => 'Ce message est trop long (2000 caractères maximum).',
        ];
    }
}
