<?php

namespace App\Actions\Paiement;

use App\Models\Paiement;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * RF-015 — Liste des reversements du propriétaire/gestionnaire connecté. Lecture seule : le
 * reversement lui-même est "un processus automatique côté backend selon un cycle défini"
 * (commentaire de fetchReversements, paiementApi.ts), déclenché par `TraiterWebhookPaiement` à la
 * confirmation du paiement (RF-014), jamais par le frontend ni par cet endpoint.
 *
 * **Arbitrage utilisateur (9 septembre 2026)** : RF-015 ne fixait ni taux de commission ni cycle
 * de reversement — d'abord laissés `null` (voir l'historique dans `backlog.md`, US-15) le temps
 * qu'une vraie décision existe, puis tranchés explicitement (commission 10% provisoire, cycle
 * immédiat dès confirmation — voir `config/paiement.php`). Seul le paiement effectivement `valide`
 * compte comme un reversement potentiel : un paiement encore en attente ou échoué n'est de
 * l'argent dû à personne, indépendamment du taux/cycle retenu.
 */
class ObtenirReversements
{
    public function handle(User $proprietaire): Collection
    {
        return Paiement::query()
            ->where('statut', 'valide')
            ->whereHas('reservation.creneau.terrain', function ($query) use ($proprietaire) {
                $query->where('proprietaire_id', $proprietaire->id);
            })
            ->with('reservation')
            ->get();
    }
}
