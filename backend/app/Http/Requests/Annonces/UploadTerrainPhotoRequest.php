<?php

namespace App\Http\Requests\Annonces;

use App\Http\Requests\ApiFormRequest;

/**
 * RF-004 — Upload d'une photo de terrain. Champ `photo`, même contrat que l'upload de photo de
 * profil (US-03, UploadPhotoRequest) — voir CreateTerrainForm.tsx/CreateTerrainScreen.tsx pour la
 * confirmation du nom de champ FormData.
 */
class UploadTerrainPhotoRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => ['required', 'image', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'photo.required' => 'Sélectionne une photo.',
            'photo.image' => "Le fichier envoyé n'est pas une image valide.",
            'photo.max' => "L'image ne doit pas dépasser 5 Mo.",
        ];
    }
}
