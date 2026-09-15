<?php

namespace App\Http\Requests\Authentification;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

/**
 * RF-001 — Inscription. Les règles ci-dessous reprennent exactement celles déjà appliquées côté
 * frontend (packages/auth-core/src/validation.ts, `validateRegisterPayload`) : même longueur
 * minimale de mot de passe, même acceptation "email OU téléphone". Le frontend valide déjà pour
 * l'UX (retour immédiat sans aller-retour réseau), mais la validation qui compte réellement est
 * celle-ci — jamais faire confiance à une validation cliente seule.
 */
class RegisterRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        // Inscription publique — RF-001 ne réserve cette action à personne en particulier.
        return true;
    }

    public function rules(): array
    {
        // Même regex que EMAIL_REGEX/PHONE_REGEX (validation.ts) — un identifiant qui passerait
        // côté frontend mais échouerait ici (ou l'inverse) casserait silencieusement le contrat.
        $emailOuTelephone = '/^([^\s@]+@[^\s@]+\.[^\s@]+)$|^(\+?[0-9\s]{8,15})$/';

        return [
            'identifiant' => [
                'required',
                'string',
                'regex:'.$emailOuTelephone,
                Rule::unique('users', 'email_ou_telephone'),
            ],
            // MIN_PASSWORD_LENGTH (validation.ts) : hypothèse assumée côté frontend, aucun seuil
            // chiffré dans le SRS/PRD pour RF-001 — reprise telle quelle, pas une règle inventée
            // ici pour la première fois.
            'motDePasse' => ['required', 'string', 'min:8'],
            'sports' => ['required', 'array', 'min:1'],
            'sports.*' => ['required', 'string', Rule::in(['foot', 'tennis', 'basket'])],
        ];
    }

    public function messages(): array
    {
        return [
            'identifiant.regex' => 'Format invalide : saisis un email ou un numéro de téléphone valide.',
            'identifiant.unique' => 'Cet email ou ce numéro est déjà utilisé.',
            'motDePasse.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            // .required ET .min : un tableau vide échoue sur `required` avant même d'atteindre
            // `min:1` (découvert en testant réellement, voir Pest) — les deux messages doivent
            // donc porter le même texte pour que le cas "aucun sport" affiche toujours ceci.
            'sports.required' => 'Sélectionne au moins un sport pratiqué.',
            'sports.min' => 'Sélectionne au moins un sport pratiqué.',
        ];
    }
}
