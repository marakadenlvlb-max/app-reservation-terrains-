<?php

namespace App\Http\Requests\Recherche;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

/**
 * RF-007/RF-008/RF-022 (US-07/US-09/US-23) — contrat exact de searchTerrains (rechercheApi.ts).
 * Tous les champs sont optionnels : "je regarde ce qu'il y a" sans filtre est un usage légitime
 * (voir le commentaire de RechercheFiltres, types.ts).
 *
 * `equipements` arrive en un seul paramètre texte séparé par des virgules
 * (`params.set('equipements', filtres.equipements.join(','))`, rechercheApi.ts), pas en tableau
 * de query params — la règle valide donc une chaîne, le découpage se fait dans l'Action.
 */
class RechercheTerrainsRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sport' => ['nullable', 'string', Rule::in(['foot', 'tennis', 'basket'])],
            'localisation' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'heure' => ['nullable', 'date_format:H:i'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'prixMax' => ['nullable', 'numeric', 'min:0'],
            'distanceMaxKm' => ['nullable', 'numeric', 'min:0'],
            'equipements' => ['nullable', 'string'],
        ];
    }
}
