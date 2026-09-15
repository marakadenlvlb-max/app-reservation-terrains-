<?php

namespace App\Actions\Authentification;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * RF-003 — Upload de la photo de profil. Stockée sur le disque `public` (nécessite
 * `php artisan storage:link` en environnement réel pour que l'URL générée soit servie — non
 * exécuté ici, cet environnement de développement n'a pas de serveur HTTP réel à tester dessus).
 */
class TeleverserPhotoProfil
{
    public function handle(User $utilisateur, UploadedFile $photo): User
    {
        $chemin = $photo->store('profils', 'public');

        $utilisateur->update(['photo_url' => Storage::disk('public')->url($chemin)]);

        return $utilisateur;
    }
}
