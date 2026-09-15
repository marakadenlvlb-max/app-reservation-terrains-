<?php

namespace App\Actions\Annonces;

use App\Models\Terrain;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * RF-004 — Upload d'une photo pour un terrain déjà créé. `photos` est un tableau JSON
 * (architecture.md) : chaque upload ajoute une URL à la liste plutôt que de la remplacer — un
 * terrain peut avoir plusieurs photos.
 */
class TeleverserPhotoTerrain
{
    /**
     * @return string L'URL de la photo tout juste ajoutée — uploadTerrainPhoto (terrainApi.ts)
     *                n'attend que { photoUrl }, pas le terrain complet (contrairement à update()).
     */
    public function handle(Terrain $terrain, User $utilisateur, UploadedFile $photo): string
    {
        if ($terrain->proprietaire_id !== $utilisateur->id) {
            throw new AuthorizationException("Cette annonce ne t'appartient pas.");
        }

        $chemin = $photo->store('terrains', 'public');
        $url = Storage::disk('public')->url($chemin);

        $terrain->update(['photos' => [...$terrain->photos, $url]]);

        return $url;
    }
}
