<?php

namespace App\Actions\Notification;

use App\Models\Notification;
use App\Models\Reservation;

/**
 * RF-020 — "Rappeler au joueur son créneau à l'approche de l'horaire réservé." Invoquée par la
 * tâche planifiée `notifications:rappels-creneaux` (voir routes/console.php et
 * app/Console/Commands/EnvoyerRappelsCreneauxCommand.php), pas directement par une route API :
 * un rappel n'est déclenché par aucune action utilisateur, seulement par le temps qui passe.
 *
 * Idempotente par construction (`whereDoesntHave('notifications', ...)`) : la tâche peut tourner
 * aussi souvent que voulu (toutes les 15 minutes, par exemple) sans jamais créer deux rappels
 * pour la même réservation.
 *
 * Seul le joueur est notifié (RF-020 : "rappeler AU JOUEUR son créneau") — contrairement à la
 * confirmation (CreerNotificationsConfirmation), qui notifie les deux parties.
 */
class EnvoyerRappelsCreneaux
{
    public function handle(): int
    {
        $limite = now()->addHours((int) config('notification.delai_rappel_heures'));

        $reservations = Reservation::where('statut', 'confirmee')
            ->whereHas('creneau', function ($query) use ($limite) {
                $query->whereBetween('debut', [now(), $limite]);
            })
            ->whereDoesntHave('notifications', function ($query) {
                $query->where('type', 'rappel_creneau');
            })
            ->with('creneau.terrain')
            ->get();

        foreach ($reservations as $reservation) {
            $terrain = $reservation->creneau->terrain;
            $heureDebut = $reservation->creneau->debut->format('H:i');

            Notification::create([
                'destinataire_id' => $reservation->joueur_id,
                'reservation_id' => $reservation->id,
                'type' => 'rappel_creneau',
                'titre' => 'Rappel de créneau',
                'message' => "Ton créneau au terrain de {$terrain->adresse} commence à {$heureDebut}.",
                'lue' => false,
            ]);
        }

        return $reservations->count();
    }
}
