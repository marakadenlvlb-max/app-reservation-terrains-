<?php

namespace App\Actions\Notification;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * RF-020 — Journal des notifications du destinataire connecté. Triées par date de création
 * décroissante, comme l'historique (US-18/US-19) — même raisonnement : ordre attendu par défaut,
 * pas une règle métier.
 */
class ObtenirNotifications
{
    public function handle(User $utilisateur): Collection
    {
        return Notification::where('destinataire_id', $utilisateur->id)
            ->orderByDesc('created_at')
            ->get();
    }
}
