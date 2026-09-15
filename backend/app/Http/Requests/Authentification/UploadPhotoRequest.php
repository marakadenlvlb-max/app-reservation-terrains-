<?php

namespace App\Http\Requests\Authentification;

use App\Http\Requests\ApiFormRequest;

/**
 * RF-003 — Upload de la photo de profil. Le champ `photo` est le nom exact utilisé par les deux
 * plateformes pour construire le FormData (voir ProfileForm.tsx et ProfileScreen.tsx,
 * `formData.append('photo', ...)`) — ne pas le renommer sans mettre à jour le frontend.
 *
 * Aucune règle métier ne fixe de taille maximale dans le SRS/architecture.md pour cet upload :
 * 5 Mo est un plafond technique raisonnable (pas une règle métier) pour éviter un upload
 * démesuré, pas une valeur tirée du cahier des charges.
 */
class UploadPhotoRequest extends ApiFormRequest
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
