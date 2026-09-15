<?php

namespace App\Http\Resources\Authentification;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forme exacte de `Profile` (packages/auth-core/src/types.ts) : utilisateurId, nom, ville,
 * photoUrl, sports — camelCase, à traduire depuis les colonnes snake_case de UTILISATEUR.
 */
class ProfilResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'utilisateurId' => $this->id,
            'nom' => $this->nom,
            'ville' => $this->ville,
            'photoUrl' => $this->photo_url,
            'sports' => $this->sports_pratiques,
        ];
    }
}
