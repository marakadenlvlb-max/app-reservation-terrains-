<?php

namespace App\Http\Requests\Authentification;

use App\Http\Requests\ApiFormRequest;

/**
 * RF-002 — Connexion. Validation volontairement légère (présence seulement), comme côté frontend
 * (validateLoginPayload) : la correction du couple identifiant/mot de passe est vérifiée dans
 * l'Action (ConnecterUtilisateur), pas ici — un Form Request valide la *forme* de la requête, pas
 * si le compte existe.
 */
class LoginRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'identifiant' => ['required', 'string'],
            'motDePasse' => ['required', 'string'],
        ];
    }
}
