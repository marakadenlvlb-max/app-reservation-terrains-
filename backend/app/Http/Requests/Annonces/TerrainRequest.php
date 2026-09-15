<?php

namespace App\Http\Requests\Annonces;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

/**
 * RF-004/RF-005 — Publication ET modification d'une annonce (US-06 : "même forme que la
 * création", packages/annonces-core/src/types.ts, `UpdateTerrainPayload = CreateTerrainPayload`)
 * — un seul Form Request pour les deux, comme côté frontend. Reprend exactement
 * validateCreateTerrainPayload (validation.ts) : seuls sport et adresse sont vraiment requis.
 *
 * RF-021 (correction du 9 septembre 2026) : `paliers` est désormais requis avec au moins un
 * élément — un terrain ne peut plus être publié ni modifié sans politique d'annulation configurée
 * (décision explicite du porteur de projet, voir architecture.md). `fraisAnnulationPourcentage`
 * reste optionnel : absent/`null` → taux par défaut calculé par le backend (voir
 * AttribuerFraisAnnulationDefaut), une valeur → le propriétaire fixe la sienne.
 */
class TerrainRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sport' => ['required', 'string', Rule::in(['foot', 'tennis', 'basket'])],
            'adresse' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:255'],
            'equipements' => ['array'],
            'equipements.*' => ['string', Rule::in(['vestiaires', 'eclairage', 'surface'])],
            // required + min:1 doivent partager le même message (voir dev-laravel/SKILL.md) : un
            // tableau vide échoue sur `required` avant même d'atteindre `min:1`.
            'paliers' => ['required', 'array', 'min:1'],
            'paliers.*.delaiMinutes' => ['required', 'integer', 'min:0'],
            'paliers.*.pourcentageRemboursement' => ['required', 'numeric', 'min:0', 'max:100'],
            'fraisAnnulationPourcentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'sport.required' => 'Sélectionne le sport pratiqué sur ce terrain.',
            'adresse.required' => "L'adresse est requise pour que les joueurs puissent te trouver.",
            'paliers.required' => "Configure au moins un palier d'annulation avant de publier ce terrain.",
            'paliers.min' => "Configure au moins un palier d'annulation avant de publier ce terrain.",
            'paliers.*.delaiMinutes.required' => "Chaque palier doit préciser un délai, en minutes avant le créneau.",
            'paliers.*.pourcentageRemboursement.required' => 'Chaque palier doit préciser un pourcentage remboursé.',
        ];
    }
}
