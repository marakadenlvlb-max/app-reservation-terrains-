<?php

namespace App\Http\Resources\Authentification;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forme commune à RegisterResult et LoginResult (packages/auth-core/src/types.ts) :
 * `{ utilisateurId, identifiant }`. Le champ `token` (LoginResult uniquement, absent de
 * RegisterResult — voir InscrireUtilisateur) est ajouté par le contrôleur via `->additional()`
 * plutôt que porté ici, pour que cette Resource reste réutilisable par les deux endpoints.
 */
class UtilisateurAuthResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'utilisateurId' => $this->id,
            'identifiant' => $this->email_ou_telephone,
        ];
    }
}
