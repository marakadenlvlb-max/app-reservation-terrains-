<?php

namespace App\Http\Controllers\Api\Authentification;

use App\Actions\Authentification\MettreAJourProfil;
use App\Actions\Authentification\TeleverserPhotoProfil;
use App\Http\Controllers\Controller;
use App\Http\Requests\Authentification\UpdateProfileRequest;
use App\Http\Requests\Authentification\UploadPhotoRequest;
use App\Http\Resources\Authentification\ProfilResource;
use Illuminate\Http\Request;

/**
 * RF-003 — Édition du profil. Contrat exact déjà attendu par le frontend :
 * packages/auth-core/src/profileApi.ts. Toutes les routes sont protégées par `auth:sanctum`
 * (routes/api.php) : `$request->user()` est donc toujours l'utilisateur connecté, jamais un id
 * arbitraire pris dans l'URL — il n'y a pas de "profil d'un autre utilisateur" à consulter ici.
 */
class ProfilController extends Controller
{
    public function show(Request $request): ProfilResource
    {
        return new ProfilResource($request->user());
    }

    public function update(UpdateProfileRequest $request, MettreAJourProfil $action): ProfilResource
    {
        $utilisateur = $action->handle($request->user(), $request->validated());

        return new ProfilResource($utilisateur);
    }

    public function uploadPhoto(UploadPhotoRequest $request, TeleverserPhotoProfil $action): array
    {
        $utilisateur = $action->handle($request->user(), $request->file('photo'));

        // Contrat exact de uploadProfilePhoto (profileApi.ts) : { photoUrl: string } — pas le
        // profil complet, contrairement aux deux autres endpoints ci-dessus.
        return ['photoUrl' => $utilisateur->photo_url];
    }
}
