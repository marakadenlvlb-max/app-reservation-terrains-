<?php

namespace App\Actions\Messagerie;

use App\Models\Message;
use App\Models\Reservation;
use App\Models\User;

/**
 * RF-023 — envoi d'un message dans la conversation d'une réservation. Même vérification
 * d'autorisation que la consultation (ObtenirMessages::assertPartiePrenante) : impossible
 * d'écrire dans une conversation à laquelle on ne participe pas.
 */
class EnvoyerMessage
{
    public function handle(User $auteur, Reservation $reservation, string $contenu): Message
    {
        ObtenirMessages::assertPartiePrenante($auteur, $reservation);

        return Message::create([
            'reservation_id' => $reservation->id,
            'auteur_id' => $auteur->id,
            'contenu' => $contenu,
        ]);
    }
}
