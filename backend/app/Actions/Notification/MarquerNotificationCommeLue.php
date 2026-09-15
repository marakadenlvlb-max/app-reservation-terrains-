<?php

namespace App\Actions\Notification;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * RF-020 — Marquer une notification comme lue. Seul le destinataire peut la marquer — frontière
 * d'autorisation de base (comme partout ailleurs dans ce projet), pas une règle métier incertaine.
 */
class MarquerNotificationCommeLue
{
    public function handle(Notification $notification, User $utilisateur): Notification
    {
        if ($notification->destinataire_id !== $utilisateur->id) {
            throw new AuthorizationException("Cette notification ne t'appartient pas.");
        }

        $notification->update(['lue' => true]);

        return $notification;
    }
}
