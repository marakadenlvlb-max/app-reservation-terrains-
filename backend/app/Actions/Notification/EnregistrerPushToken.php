<?php

namespace App\Actions\Notification;

use App\Models\User;

/**
 * RF-020 — Enregistre le jeton push d'un appareil pour l'utilisateur connecté
 * (`UTILISATEUR.push_tokens`, json). Un même utilisateur peut avoir plusieurs appareils
 * (plusieurs jetons) : on ajoute à la liste plutôt que de la remplacer, en évitant les doublons
 * (ex. l'app relance l'enregistrement à chaque visite de l'écran notifications côté mobile —
 * voir usePushRegistration côté frontend — donc le même jeton peut être renvoyé plusieurs fois).
 */
class EnregistrerPushToken
{
    public function handle(User $utilisateur, string $pushToken): User
    {
        $jetons = $utilisateur->push_tokens ?? [];

        if (! in_array($pushToken, $jetons, true)) {
            $jetons[] = $pushToken;
            $utilisateur->update(['push_tokens' => $jetons]);
        }

        return $utilisateur;
    }
}
