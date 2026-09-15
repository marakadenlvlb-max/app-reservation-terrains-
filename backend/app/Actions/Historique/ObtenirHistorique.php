<?php

namespace App\Actions\Historique;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * RF-018 (joueur) / RF-019 (propriétaire) — Les deux vues sont "structurellement identiques,
 * seul le point de vue change" (packages/historique-core/src/types.ts) : une seule Action, un
 * paramètre `$role` qui détermine à la fois le filtre (mes réservations vs réservations reçues
 * sur mes terrains) et qui compte comme "l'autre partie" de chaque réservation.
 *
 * Triées par date de création décroissante (plus récent d'abord) — ordre raisonnable pour un
 * historique, non imposé par le SRS mais pas non plus une règle métier à trancher : personne ne
 * s'attend à un historique dans le désordre.
 */
class ObtenirHistorique
{
    public function handle(User $utilisateur, string $role): Collection
    {
        $reservations = $role === 'joueur'
            ? $this->pourJoueur($utilisateur)
            : $this->pourProprietaire($utilisateur);

        // `autre_partie` : propriété dynamique, pas une colonne — voir HistoriqueReservationResource.
        // Calculée ici (une seule fois, avec les relations déjà chargées) plutôt que dans la
        // Resource, pour ne pas lui faire porter une décision "qui est l'autre partie selon le
        // rôle" qui n'est pas de son ressort.
        return $reservations->each(function (Reservation $reservation) use ($role) {
            $reservation->autre_partie = $role === 'joueur'
                ? $reservation->creneau->terrain->proprietaire
                : $reservation->joueur;
        });
    }

    private function pourJoueur(User $joueur): Collection
    {
        return Reservation::where('joueur_id', $joueur->id)
            ->with('creneau.terrain.proprietaire')
            ->orderByDesc('created_at')
            ->get();
    }

    private function pourProprietaire(User $proprietaire): Collection
    {
        return Reservation::whereHas('creneau.terrain', function ($query) use ($proprietaire) {
            $query->where('proprietaire_id', $proprietaire->id);
        })
            ->with(['creneau.terrain', 'joueur'])
            ->orderByDesc('created_at')
            ->get();
    }
}
