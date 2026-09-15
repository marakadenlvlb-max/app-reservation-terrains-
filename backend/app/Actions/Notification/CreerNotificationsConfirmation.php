<?php

namespace App\Actions\Notification;

use App\Models\Notification;
use App\Models\Reservation;

/**
 * RF-020 — "Le système doit notifier le joueur ET le propriétaire/gestionnaire à la confirmation
 * d'une réservation" : deux notifications, une par destinataire, appelée depuis
 * TraiterWebhookPaiement (module Paiement) au moment exact où RF-014 fait passer la réservation à
 * 'confirmee' — c'est le seul endroit du backend qui sait qu'une confirmation vient d'avoir lieu.
 */
class CreerNotificationsConfirmation
{
    public function handle(Reservation $reservation): void
    {
        $terrain = $reservation->creneau->terrain;
        $debut = $reservation->creneau->debut->format('d/m/Y à H:i');

        Notification::create([
            'destinataire_id' => $reservation->joueur_id,
            'reservation_id' => $reservation->id,
            'type' => 'confirmation_reservation',
            'titre' => 'Réservation confirmée',
            'message' => "Ta réservation du terrain de {$terrain->adresse} est confirmée pour le {$debut}.",
            'lue' => false,
        ]);

        Notification::create([
            'destinataire_id' => $terrain->proprietaire_id,
            'reservation_id' => $reservation->id,
            'type' => 'confirmation_reservation',
            'titre' => 'Réservation reçue',
            'message' => "Un joueur a réservé et payé ton terrain de {$terrain->adresse} pour le {$debut}.",
            'lue' => false,
        ]);
    }
}
